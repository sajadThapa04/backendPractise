import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async userId => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Refresh and Access Token not generated");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //first get data from frontend.
  //validation - not empty.
  //check if user already exist.
  //check for images and avatar.
  //check if the image and videos has been uploaded or not on cloudinary.
  //create user object - create entry in Db.
  //remove password and refresh token.
  //check for user creation.

  const { username, email, fullname, password } = req.body;
  // console.log("username:", username);
  if ([username, email, fullname, password].some(
    field => field
      ?.trim() === "")) {
    throw new ApiError(404, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{
      email
    }, {
      username
    }]
  });

  if (existedUser)
    throw new ApiError(404, `email or username already exits`);

  const avatarLocalFilePath = req.files
    ?.avatar[0]
    ?.path;
  // const coverImageLocalFilePath = req.files?.coverImage[0]?.path

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "please upload Avatar image");
  }
  let coverImageLocalFilePath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalFilePath = req.files.coverImage[0].path
  }
  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

  if (!avatar) {
    throw new ApiError(400, "please upload Avatar image");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    avatar: avatar
      ?.url,
    avatar_public_id: avatar?.public_id,
    coverImage: coverImage
      ?.url || "",
    coverImage_public_id: coverImage?.public_id,
    password
  });
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering");
  }

  return res.status(201).json(new ApiResponse(200, "Register successfull", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  //take username email password from req.body
  //validate that cred with db
  //generate access and refresh token
  //send cookies
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{
      email
    }, {
      username
    }]
  });

  if (!user) {
    throw new ApiError(404, " email and username not registered");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  //make sure when you select write it properly like -password not - password its very important
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  };

  return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {
    user: loggedInUser,
    accessToken,
    refreshToken
  }, "User logged in successfuly"));
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined
    }
  }, { new: true });
  const options = {
    httpOnly: true,
    secure: true
  };

  return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(
      decodedToken
        ?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (
      incomingRefreshToken !== user
        ?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true
    };

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(new ApiResponse(200, {
      accessToken,
      refreshToken: newRefreshToken
    }, "Access token refreshed"));
  } catch (error) {
    throw new ApiError(401, error.message, "invalid refresh token");
  }
});

const changeUserCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;
  const user = await User.findById(
    req.user
      ?._id);

  if (!user) {
    throw new ApiError(401, "User not found");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, "Old and new password are same");
  }

  if (!(newPassword === confPassword)) {
    throw new ApiError(401, "New password and confirm new password did not match");
  }
  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, {}, "your password is changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "current users fetched Successfully"));
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!(fullname || email)) {
    throw new ApiError(401, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user
      ?._id, {
    $set: {
      fullname,
      email
    }
  }, { new: true }).select("-password -refreshToken");

  res.status(200).json(new ApiResponse(200, user, "your details has been updated"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalFilePath = req.file
    ?.path;

  if (!avatarLocalFilePath) {
    throw new ApiError(401, "please provide avatar image");
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);

  if (!avatar.url) {
    throw new ApiError(401, "Error while uploading on cloudinary");
  }

  // delete userAvataImage url from cloudinary using public_id

  const findUser = await User.findById(req.user?._id);
  const avatar_public_id = findUser?.avatar_public_id;
  console.log(avatar_public_id);
  await deleteFromCloudinary(avatar_public_id);

  const user = await User.findByIdAndUpdate(
    req.user
      ?._id, {
    $set: {
      avatar: avatar
        ?.url,
      avatar_public_id: avatar?.public_id
    }
  }, { new: true }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(403, "User not found");
  }
  return res.status(200).json(new ApiResponse(200, user, "avatar image updated successfully"))
  console.log(user);

});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file
    ?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "please provice cover Image");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(402, "Error while uploading on cloudinary");
  }


  // delete userCoverImage url from cloudinary using public_id

  const findUser = await User.findById(req.user?._id);
  const coverImage_public_id = findUser?.coverImage_public_id;

  console.log(coverImage_public_id);
  await deleteFromCloudinary(coverImage_public_id);

  const user = await User.findByIdAndUpdate(
    req.user
      ?._id, {
    $set: {
      coverImage: coverImage?.url,
      coverImage_public_id: coverImage?.public_id
    }
  }, { new: true });

  if (!user) {
    throw new ApiError(400, "No users found");
  }

  return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"))
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "please provide your username");
  }
  refreshAccessToken;
  if (!refreshAccessToken) {
    throw new ApiError(402, "please log in");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        subscription: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {
              in: [req.user?._id, "$subscribers.subscriber"]
            },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        subscription: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  console.log(channel);
  if (!channel?.length) {
    throw new ApiError(403, "Channel does not exit");
  }

  res.status(200).json(new ApiResponse(200, channel[0], "Users channel fetched successfully"));
})

const getWatchhistory = asyncHandler(async (req, res) => {

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
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
                    avatar: 1,
                  }
                }
              ]

            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }


  ])

  if (!user) {
    throw new ApiError(403, "can not get Watch History")
  }

  res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));

})

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeUserCurrentPassword,
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchhistory
};
