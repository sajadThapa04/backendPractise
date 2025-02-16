import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    // List of allowed fields for sorting
    const ALLOWED_SORT_FIELDS = ["title", "description", "createdAt", "views", "duration"];

    const pageNumber = parseInt(page) //chaning the page to Int
    const limitNumber = parseInt(limit); // changing the limit to Int

    const filter = {} //  creating and empty filter obj

    if (userId) {
        filter.owner = new mongoose.Types.ObjectId(userId);
    }

    if (query) {
        const regex = new RegExp(query, "i");
        filter.$or = [
            { title: regex },
            { description: regex }
        ]
    }


    const sortOptions = {}
    if (sortBy && ALLOWED_SORT_FIELDS.includes(sortBy)) {
        sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
    } else {
        sortOptions.createdAt = 1
    }

    //video aggreagtion pipeline

    const filterVideo = await Video.aggregate([
        { $match: filter },
        { $sort: sortOptions },
        { $skip: (pageNumber - 1) * limitNumber },
        { $limit: limitNumber },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline: [
                    {
                        $project: {
                            content: 1
                        }
                    }
                ]
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
        { $unwind: "$comments" },
        { $unwind: "$owner" },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                owner: 1,
                views: 1,
                comments: 1
            }
        }
    ])

    if (!filterVideo.length) {
        throw new ApiError(403, "No videos found")
    }

    res.status(200).json(new ApiResponse(200, filterVideo[0], "videos found successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    // TODO: get video, upload to cloudinary, create video
    if ([title, description].some(field => field?.trim() === "")) {
        throw new ApiError(402, "Please provide title and description")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    // console.log(req.files)   checking we are receiving the req.files or not

    if (!(videoFileLocalPath || thumbnailLocalPath)) {
        throw new ApiError(403, "video and thumbnail required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!(videoFile || thumbnail)) {
        throw new ApiError(403, "video and thumbnail required")
    }

    const uploadedVideo = await Video.create({
        title,
        description,
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        duration: videoFile?.duration,
        owner: req.user?._id,

    })

    // console.log(uploadedVideo);

    if (!updateVideo) {
        throw new ApiError(503, "Something went wrong")
    }

    res.status(200).json(new ApiResponse(200, uploadedVideo, "successfully uploaded video"));

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id



    const searchVideoById = await Video.findById(videoId)

    if (searchVideoById) {
        searchVideoById.views += 1
        searchVideoById.save();
    } else {
        throw new ApiError(403, "no videos found");
    }

    const joinVideoToUsersLikesAndComments = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline: [
                    {
                        $project: {
                            content: 1
                        }
                    }
                ]
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
        { $unwind: "$comments" },
        { $unwind: "$owner" },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                owner: 1,
                views: 1,
                comments: 1
            }
        }
    ])
    if (!joinVideoToUsersLikesAndComments?.length) {
        throw new ApiError(403, "No videos found")
    }
    res.status(200).json(new ApiResponse(200, joinVideoToUsersLikesAndComments[0], "videos found successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail


    const { title, description } = req.body;


    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(403, "No videos found")
    }

    if (video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "you are not authorized to update other users video");
    }
    const videoFileLocalPath = req.file
        ?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(402, "please provide video file")
    }
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)

    if (!videoFile?.url) {
        throw new ApiError(502, "Something went wrong while uploading on cloudinary")
    }

    const updateVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                videoFile: videoFile?.url,
                duration: videoFile?.duration,
                title: title,
                description: description
            }
        }
    )

    if (!updateVideo) {
        throw new ApiError(503, "Not uploaded")
    }
    res.status(200).json(new ApiResponse(200, updateVideo, "Video updated Successfully"));


})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video


    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(403, "no videos found to delete");
    }
    if (video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "you are not authorized to update other users video");
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId)


    if (!deleteVideo) {
        throw new ApiError(503, "Something went wrong while deleting video")
    }


    res.status(200).json(200, deleteVideo, "Successfully deleted video");
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(403, "No videos found")
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(402, "not authorised to toggle other users video");
    }

    const toggleVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                isPublished: !(video.isPublished)
            }
        },
        {
            new: true
        }
    )

    if (!toggleVideo) {
        throw new ApiError(400, "Video not found")
    }

    res.status(200).json(new ApiResponse(200, toggleVideo, "Video toggled successfully"))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
