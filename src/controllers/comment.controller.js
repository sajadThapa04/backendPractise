import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const videoComment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort: {
                createdAt: 1
            }
        },
        {
            $skip: (pageNumber - 1) * limitNumber
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "users",
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
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            owner: 1,
                            views: 1,
                            isPublished: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$users" },
        { $unwind: "$videos" },
        {
            $project: {
                content: 1,
                users: 1,
                videos: 1
            }
        }
    ])

    if (!videoComment.length) {
        throw new ApiError(404, "No comment found")
    }
    res.status(200).json(new ApiResponse(200, videoComment, "comment got successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body

    if (!content) {
        throw new ApiError(403, "Please add comment")
    }
    const { videoId } = req.params
    const videoComment = await Video.findById(videoId);
    if (!videoComment) {
        throw new ApiError(403, "No video id found");
    }

    const addComment = await Comment.create({
        content,
        owner: req.user?._id,
        video: videoId
    })

    if (!addComment) {
        throw new ApiError(503, "not able to create Comment")
    }

    res.status(200).json(new ApiResponse(200, addComment, "comment added succesfully"));


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { content } = req.body
    const { commentId } = req.params
    if (!commentId) {
        throw new ApiError(403, "please provide commentId")
    }

    const comment = await Comment.findById(commentId);

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Not allowed to update other users comment");
    }

    const updateComment = await Comment.findByIdAndUpdate(commentId, {
        $set: {
            content: content
        },

    },
        {
            new: true
        }
    )

    if (!updateComment) {
        throw new ApiError(503, "Not able to update comment");
    }
    res.status(200).json(new ApiResponse(200, updateComment, "successfully updated Comment"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!commentId) {
        throw new ApiError(403, "No comment found")
    }
    const comment = await Comment.findById(commentId);

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Not allowed to delete other users comment");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if (!deletedComment) {
        throw new ApiError(503, "Not able to delete comment");
    }
    res.status(200).json(new ApiResponse(200, deletedComment, "comment deleted successfully"));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
