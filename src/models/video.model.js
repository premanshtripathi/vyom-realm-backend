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
    videoFile: {
      type: String, // cloudinary URL.
      required: [true, "Video URL is required!"],
    },
    thumbnail: {
      type: String, // cloudinary URL.
      required: [true, "Video Thumbnail URL is required!"],
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

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
