import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorisation")?.replace("Bearer", "")
        if (!token) {
            throw new ApiError(401, "unauthorized request");
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -ref_hToken");
        if (!user) {
            throw new ApiError(403, "Invalid access token");
        }

        req.user = user
        next();

    } catch (error) {
        throw new ApiError(401, error.message, "Invalid access token");
    }
})