import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    //first need to find the channel.
    //check weather the users is already subscriber or not


    if (!channelId) {
        throw new ApiError(403, "please provide channel id");
    }
    // const channel = await Subscription.findById(channelId);
    // if (!channel) {
    //     throw new ApiError(404, "no Channel found");
    // }

    const userId = req.user?._id
    const subscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if (subscription) {
        const deleteSubscription = await Subscription.findByIdAndDelete(subscription._id)
        res.status(200).json(new ApiResponse(200, deleteSubscription, "unsubscribed successfully"))
    } else {
        const newSubscription = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })

        res.status(200).json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new ApiError(403, "please provide channelId")
    }

    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                totalSubscriber: {
                    $size: "$subscribers"
                }
            }
        },
        {
            $unwind: {
                path: "$subscribers",
                preserveNullAndEmptyArrays: true // Keep videos without comments
            }
        },
        {
            $project: {
                subscribers: {
                    username: 1,
                    fullname: 1,
                    avatar: 1
                },
                channel: 1,
                subscriber: 1,
                totalSubscriber: 1
            }
        }
    ])
    if (!subscriber.length) {
        throw new ApiError(403, "no subsciber found")
    }
    res.status(200).json(new ApiResponse(200, subscriber, "subscibers got succesfully"));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError(403, "No channel found ");
    }

    const channelSubscibed = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribed: {
                    $size: "$subscribedTo"
                }
            }
        },

        {
            $unwind: "$subscribedTo"
        },
        {
            $project: {
                subscribedTo: {
                    username: 1,
                    fullname: 1,
                    avatar: 1
                },
                subscribed: 1,
                subscriber: 1,
                channel: 1

            }
        }
    ])

    if (!channelSubscibed.length) {
        throw new ApiError(403, "you have not subscribed to any channel")
    }
    res.status(200).json(new ApiResponse(200, channelSubscibed[0], "subscribed channel got successfully"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}