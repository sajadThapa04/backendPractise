import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist

    const { name, description, videos } = req.body


    if ([name, description].some(field => field?.trim() === "")) {
        throw new ApiError(403, "please provide name and description for playlist");
    }


    const playlist = await Playlist.create({
        name: name,
        description: description,
        owner: req.user?._id,
        videos: videos || []
    })

    if (!playlist) {
        throw new ApiError(503, "not able to create playlist");
    }

    res.status(200).json(new ApiResponse(200, playlist, " playlist create successfully"));


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10, } = req.query
    //TODO: get user playlists

    if (!userId) {
        throw new ApiError(403, "please provide userId");
    }

    const getUserPlaylists = await Playlist.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId) // Match playlists by owner
                }
            },
            {
                $skip: ((parseInt(page) - 1) * parseInt(limit))
            },
            {
                $lookup: {
                    from: "users", // Join with the users collection
                    localField: "owner",
                    foreignField: "_id",
                    as: "getUsers",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar: 1 // Include only necessary fields
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$getUsers" // Unwind the getUsers array
            },
            {
                $lookup: {
                    from: "videos", // Join with the videos collection
                    localField: "videos",
                    foreignField: "_id",
                    as: "getVideos",
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                description: 1,
                                videoFile: 1,
                                thumbnail: 1 // Include only necessary fields
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    getUsers: 1,
                    getVideos: 1 // Include only necessary fields in the final output
                }
            }
        ]
    )

    if (!getUserPlaylists.length) {
        throw new ApiError(403, "no playlist found")
    }
    res.status(200).json(new ApiResponse(200, getUserPlaylists, "userplaylist created successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(403, "No playlist found")
    }

    res.status(200).json(new ApiResponse(200, playlist, "user playlist by id got successfully "))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!(playlistId || videoId)) {
        throw new ApiError(403, "no video found in playlist")
    }

    const playlist = await Playlist.findById(playlistId);
    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Not allowed to add to playlist of other users");
    }

    const videoPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        { new: true }
    )
    if (!videoPlaylist) {
        throw new ApiError(503, "Something went wrong when adding video to playlist")
    }

    res.status(200).json(new ApiResponse(200, videoPlaylist, "video added to playlist successfully"));




})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Check if both playlistId and videoId are provided
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID and Video ID are required");
    }

    // Find the playlist by ID
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the logged-in user is the owner of the playlist
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to remove videos from this playlist");
    }

    // Remove the video from the playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId // Remove the videoId from the videos array
            }
        },
        { new: true } // Return the updated document
    );

    // Check if the playlist was updated successfully
    if (!updatedPlaylist) {
        throw new ApiError(500, "Failed to remove video from playlist");
    }

    // Return the updated playlist
    res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(403, "no playlist found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "not allowed to delete other users playlist");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        throw new ApiError(503, "Not able to delete playlist something went wrong");
    }

    res.status(200).json(new ApiResponse(200, deletedPlaylist, "deleted successfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(403, "no playlist found")
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "not allowed to update other users playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist,
        {
            $set: {
                name,
                description,
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) {
        throw new ApiError(503, "not able to update playlist")
    }

    res.status(200).json(new ApiResponse(200, updatedPlaylist, "updated successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
