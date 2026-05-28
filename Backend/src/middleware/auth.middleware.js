import asynchandler from "../utils/asynchandler.js"
import jwt from "jsonwebtoken"
import ApiError from "../utils/apierror.js"
import { user } from "../models/user.models.js"

export const verifyJWT = asynchandler(async (req, res, next) => {
    try {
        const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const User = await user.findById(decoded?._id).select("-password -RefreshToken")

        if (!User) {
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = User
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})