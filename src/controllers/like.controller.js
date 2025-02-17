import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError(403, "No videos found")
    }

    const user = req.user?._id

    const toggleVideoLike = await Like.findOne({
        likedBy: user,
        video: videoId
    })
    if (toggleVideoLike) {
        const deletedLike = await Like.findByIdAndDelete(toggleVideoLike._id)
        if (!deletedLike) {
            throw new ApiError(503, "not able to delete like")
        }
        res.status(200).json(new ApiResponse(200, deletedLike, "like deleted successfully"));
    } else {
        const createdLike = await Like.create({
            video: videoId,
            likedBy: user
        })
        if (!createdLike) {
            throw new ApiError(503, "not able to like video")
        }
        res.status(200).json(new ApiResponse(200, createdLike, "like created successfully"));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(403, "please provide commentId");

    }
    const user = req.user?._id

    const commentLike = await Like.findOne({
        comment: commentId,
        likedBy: user
    });

    if (!commentLike) {
        const likedComment = await Like.create({
            comment: commentId,
            likedBy: user
        })
        if (!likedComment) {
            throw new ApiError(504, "something went wrong when liking comment");
        }

        res.status(200).json(new ApiResponse(200, likedComment, "comment liked successfully"));
    } else {
        const deleteLikedComment = await Like.findByIdAndDelete(commentLike?._id)
        if (!deleteLikedComment) {
            throw new ApiError(503, "Not able to delete liked comment");
        }
        res.status(200).json(new ApiResponse(200, deleteLikedComment, "delete comment successfull"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(403, "please provide tweet id")
    }

    const user = req.user?._id
    const likedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: user
    })

    if (likedTweet) {
        const deletedTweet = await Liked.findByIdAndDelete(likedTweet?._id)
        if (!deletedTweet) {
            throw new ApiError(503, "Not able to delete tweet like")
        }
        res.status(200).json(new ApiResponse(200, deletedTweet, "tweet deleted Successfully"))
    } else {
        const createLikedTweet = await Like.create({
            tweeet: tweetId,
            likedBy: user
        })
        if (!createLikedTweet) {
            throw new ApiError(503, "not able to like tweet")
        }

        res.status(200).json(new ApiResponse(200, createLikedTweet, "liked tweet successfully"));
    }

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const { videoId, page = 1, limit = 10 } = req.query;
    const filter = {}

    if (videoId) {
        filter.video = new mongoose.Types.ObjectId(videoId)
    }

    const likedVideosByUsers = await Like.aggregate(
        [
            {
                $match: filter
            },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "likedVideos",
                    pipeline: [
                        {
                            $project: {
                                videoFile: 1,
                                thumbnail: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    totalLikedVideos: {
                        $size: "$likedVideos"
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "likedBy",
                    foreignField: "_id",
                    as: "likedBy",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    totalLikedByUser: {
                        $size: "$likedBy"
                    }
                }
            },
            {
                $project: {
                    likedVideos: 1,
                    likedBy: 1,
                    totalLikedVideos: 1,
                    totalLikedByUser: 1
                }
            }
        ]
    )

    if (!likedVideosByUsers.length) {
        throw new ApiError(403, "No liked videos found");
    }
    res.status(200).json(new ApiResponse(200, likedVideosByUsers, "got liked videos by users successfully"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}