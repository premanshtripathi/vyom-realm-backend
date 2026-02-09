import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Video Title is required!"],
    },
    description: {
      type: String,
      required: [true, "Video Description is required!"],
    },
    videoFileUrl: {
      type: String, // cloudinary URL.
      required: [true, "Video URL is required!"],
    },
    videoPublicId: {
      type: String,
      required: [true, "Video Public Id is required"],
    },
    thumbnailUrl: {
      type: String, // cloudinary URL.
      required: [true, "Thumbnail URL is required!"],
    },
    thumbnailPublicId: {
      type: String,
      required: [true, "Thumbnail Public Id is required"],
    },
    duration: {
      type: Number, // from cloudinary.
      required: [true, "Video Duration is required!"],
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Feed Index: For browsing all published videos (sorted by date)
videoSchema.index({ isPublished: 1, createdAt: -1 });

// Profile Index: For browsing a specific user's videos
videoSchema.index({ owner: 1, isPublished: 1, createdAt: -1 });

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
