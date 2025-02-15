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

    console.log(uploadedVideo);

    if (!updateVideo) {
        throw new ApiError(503, "Something went wrong")
    }

    res.status(200).json(new ApiResponse(200, uploadedVideo, "successfully uploaded video"));

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(403, "No videos found")
    }

    const searchVideoById = await Video.findById(videoId)

    const joinVideoToUsersLikesAndComments = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
        //later we will join the likes and comments as well when we finish those controllers
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                owner: 1
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

    const deletedVideo = await Video.findByIdAndDelete(videoId)


    if (!deleteVideo) {
        throw new ApiError(503, "Something went wrong while deleting video")
    }


    res.status(200).json(200, deleteVideo, "Successfully deleted video");
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "no videos found")
    }

    const isPublished = await Video.aggregate([
        {
            $match: {
                isPublished: true
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                title: 1,
                description: 1
            }
        }
    ])

    if (!isPublished) {
        throw new ApiError(503, "Videos not uploaded");
    }
    res.status(200).json(200, isPublished, "Video published successfully");
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
