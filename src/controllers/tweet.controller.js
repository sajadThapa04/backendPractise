import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (!content) {
        throw new ApiError(403, "no content provided");
    }

    const createTweet = await Tweet.create({
        content,
        owner: req.user?._id
    })
    if (!createTweet) {
        throw new ApiError(503, "not able to create tweet");
    }
    res.status(200).json(new ApiResponse(200, createTweet, "tweet created successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {

    // TODO: get user tweets
    const { userId } = req.params
    const { page = 1, limit = 10, sortType, sortBy } = req.query
    const ALLOWED_SORT_FIELDS = ["content"];

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const sortOptions = {}

    if (sortBy && ALLOWED_SORT_FIELDS.includes(sortBy)) {
        sortOptions[sortBy] = sortType === "asc" ? 1 : -1
    } else {
        sortOptions.createdAt = 1
    }

    if (!userId) {
        throw new ApiError("no tweet found");
    }

    const getUserTweet = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: sortOptions
        },
        { $skip: (pageNumber - 1) * limitNumber },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userTweets",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            },

        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$userTweets"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
        ,
        {
            $project: {
                userTweets: 1,
                content: 1,
                totalLikes: 1,
                isLiked: 1
            }
        }


    ])

    if (!getUserTweet.length) {
        throw new ApiError(403, "No tweets found")
    }

    res.status(200).json(new ApiResponse(200, getUserTweet, "tweets got successfully"));

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body
    const { tweetId } = req.params;
    if (!tweetId) {
        throw new ApiError(403, "Please provide tweet id");
    }
    const tweetOwner = await Tweet.findById(tweetId);

    if (tweetOwner?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(404, "not allowed to update other tweets");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if (!updatedTweet) {
        throw new ApiError(503, "Not able to update tweet")
    }
    res.status(200).json(new ApiResponse(200, updatedTweet, "tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    if (!tweetId) {
        throw new ApiError(403, "please provide tweet id");
    }
    const tweetOwner = await Tweet.findById(tweetId);

    if (tweetOwner?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(404, "not allowed to delete other tweets");
    }
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deletedTweet) {
        throw new ApiError(503, "something went wrong not able to delete tweeet video")
    }
    res.status(200).json(new ApiResponse(200, deletedTweet, "tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
