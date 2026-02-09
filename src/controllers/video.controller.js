import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const pipeline = [];

  if (query) {
    pipeline.push({
      $search: {
        index: "default",
        text: {
          query: query,
          path: ["title", "description"],
          fuzzy: {
            maxEdits: 2,
            prefixLength: 1,
          },
        },
      },
    });

    pipeline.push({
      $addFields: {
        score: { $meta: "searchScore" },
      },
    });
  }

  const matchStage = {};

  if (userId && mongoose.isValidObjectId(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  } else if (userId) {
    throw new ApiError(400, "Invalid user Id!");
  }

  matchStage.isPublished = true;

  pipeline.push({ $match: matchStage });

  if (query && !sortBy) {
    pipeline.push({
      $sort: {
        score: -1,
        createdAt: -1,
      },
    });
  } else if (sortBy && sortType) {
    pipeline.push({ $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerDetails",
      pipeline: [{ $project: { username: 1, fullname: 1, avatar: 1 } }],
    },
  });

  pipeline.push({
    $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true },
  });

  const options = {
    page: parseInt(page, 10),
    limit: Math.min(50, parseInt(limit, 10)),
    customLabels: {
      docs: "videos",
      totalDocs: "totalVideos",
    },
  };

  const result = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  if (!result) {
    throw new ApiError(500, "Something went wrong while fetching videos!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and Description must not be empty!");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(404, "Video file is required!");
  }

  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required!");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath, "videos");
  const thumbnailFile = await uploadOnCloudinary(
    thumbnailLocalPath,
    "thumbnails"
  );

  if (!videoFile) {
    if (thumbnailFile)
      await deleteFromCloudinary(thumbnailFile.public_id, "image");
    throw new ApiError(
      500,
      "Problem in uploading video file, please try again"
    );
  }

  if (!thumbnailFile) {
    if (videoFile) await deleteFromCloudinary(videoFile.public_id, "video");
    throw new ApiError(500, "Problem in uploading thumbnail, please try again");
  }

  try {
    const video = await Video.create({
      videoFileUrl: videoFile.url,
      videoPublicId: videoFile.public_id,
      thumbnailUrl: thumbnailFile.url,
      thumbnailPublicId: thumbnailFile.public_id,
      title,
      description,
      duration: videoFile.duration,
      owner: req.user._id,
    });

    if (!video) {
      throw new ApiError(
        500,
        "Something went wrong while creating a video document in Mongo DB"
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video published successfully."));
  } catch (error) {
    if (videoFile) await deleteFromCloudinary(videoFile.public_id, "video");
    if (thumbnailFile)
      await deleteFromCloudinary(thumbnailFile.public_id, "image");
    throw new ApiError(500, "Something went wrong while publishing the video!");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const title = req.body.title || null;
  const description = req.body?.description || null;
  const thumbnailLocalPath = req.file?.path || null;
  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(400, "Nothing to update!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist!");
  }

  if (video.owner?.toString() !== req.user?._id?.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update the details of this video!"
    );
  }
  let thumbnailFile = null;
  let oldPublicId = null;
  if (title) video.title = title;
  if (description) video.description = description;
  if (thumbnailLocalPath) {
    thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath, "thumbnails");

    if (!thumbnailFile) {
      throw new ApiError(
        500,
        "Problem in uploading thumbnail, please try again"
      );
    }

    oldPublicId = video.thumbnailPublicId;
    video.thumbnailUrl = thumbnailFile.url;
    video.thumbnailPublicId = thumbnailFile.public_id;
  }
  try {
    const updatedVideo = await video.save({ validateBeforeSave: false });

    if (!updatedVideo) {
      throw new ApiError(
        500,
        "Something went wrong while saving details into Database!"
      );
    }
    if (thumbnailLocalPath && oldPublicId)
      await deleteFromCloudinary(oldPublicId);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedVideo,
          `Video details updated successfully.`
        )
      );
  } catch (error) {
    if (thumbnailFile) await deleteFromCloudinary(thumbnailFile.public_id);
    throw new ApiError(500, "Something went wrong while updating the details.");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist!");
  }

  if (video.owner?.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video!");
  }

  try {
    await deleteFromCloudinary(video.videoPublicId, "video");
    await deleteFromCloudinary(video.thumbnailPublicId, "image");

    await Video.deleteOne({ _id: video._id });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video deleted successfully."));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while deleting the video!");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist!");
  }

  if (video.owner?.toString() !== req.user?._id?.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to publish status of this video!"
    );
  }

  try {
    video.isPublished = !video.isPublished;
    const updatedVideo = await video.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedVideo,
          `Video is now ${updatedVideo.isPublished ? "Published" : "Unpublished"}`
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while toggling the publish status."
    );
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
