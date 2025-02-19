import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(403, "No channel founds with this users");
    }
    const getInfoOfChannel = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$likes"
                }
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subs"
            }
        },
        {
            $addFields: {
                totalSubs: {
                    $size: "$subs"
                }
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comment"
            }
        },
        {
            $addFields: {
                totalComments: {
                    $size: "$comment"
                }
            }
        },
        {
            $group: {
                _id: "Statistics",
                totalLikes: {
                    $sum: "$totalLikes"
                },
                totalComments: {
                    $sum: "$totalComments"
                },
                totalSubs: {
                    $sum: "$totalSubs"
                },
                Totalviews: {
                    $sum: "$views"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        }
    ])

    if (!getInfoOfChannel.length) {
        throw new ApiError(403, "no channel info found")
    }
    res.status(200).json(new ApiResponse(200, getInfoOfChannel, "channel fetched successfully"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user
        ?._id;

    if (!userId) {
        throw new ApiError(403, "No user id found");
    }
    // TODO: Get all the videos uploaded by the channel
    const getChannelVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        }, {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        }, {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                commentCount: {
                    $size: "$comments"
                }
            }
        }, {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                owner: 1,
                likesCount: 1,
                commentCount: 1
            }
        }
    ]);

    if (!getChannelVideos.length) {
        throw new ApiError(403, "No channel found")
    }

    res.status(200).json(new ApiResponse(200, getChannelVideos, "channgel videos got successfully"));
});

export {
    getChannelStats,
    getChannelVideos
}