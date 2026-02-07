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
  //TODO: get all videos based on query, sort, pagination
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
      400,
      "Problem in uploading video file, please try again"
    );
  }

  if (!thumbnailFile) {
    if (videoFile) await deleteFromCloudinary(videoFile.public_id, "video");
    throw new ApiError(400, "Problem in uploading thumbnail, please try again");
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
  //TODO: update video details like title, description, thumbnail
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
