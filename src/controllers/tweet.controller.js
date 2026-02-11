import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const content = req.body?.content?.trim();
  const owner = req.user?._id;
  if (!content) {
    throw new ApiError(400, "Content must not be empty!");
  }
  if (!owner) {
    throw new ApiError(
      400,
      "User must be logged in to create a tweet, check the auth middleware"
    );
  }
  const tweet = await Tweet.create({
    content,
    owner,
  });
  if (!tweet) {
    throw new ApiError(500, "Something went wrong while creating the tweet!");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
