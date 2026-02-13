import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Content field must not be empty!"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner field must not be empty!"],
    },
  },
  { timestamps: true }
);

tweetSchema.index({ owner: 1, createdAt: -1 });

tweetSchema.plugin(mongooseAggregatePaginate);

export const Tweet = mongoose.model("Tweet", tweetSchema);
