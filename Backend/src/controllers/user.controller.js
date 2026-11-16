import asynchandler from "../utils/asynchandler.js"
import { user } from "../models/user.models.js"
import ApiError from "../utils/apierror.js"
import apiresponse from "../utils/apiresponse.js"
import jwt from "jsonwebtoken"

const generatetokens = async (id) => {
    try {
        const User = await user.findById(id)
        const accesstoken = User.generateAccessToken()
        const refreshtoken = User.generateRefreshToken()

        User.RefreshToken = refreshtoken
        await User.save({ validateBeforeSave: false })

        return { accesstoken, refreshtoken }
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Couldn't generate tokens")
    }
}

const registeruser = asynchandler(async (req, res) => {
    const { email, password, username } = req.body
    if ([email, password, username].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const userexists = await user.findOne({
        $or: [{ username }, { email }]
    })

    if (userexists) {
        throw new ApiError(400, "User already exists")
    }

    const User = await user.create({
        username,
        email,
        password
    })

    const createdUser = await user.findById(User._id).select(
        "-password -RefreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Couldn't register the user")
    }

    return res.status(201).json(
        new apiresponse(201, createdUser, "User registered successfully")
    )
})

const loginuser = asynchandler(async (req, res) => {
    const { email, password, username } = req.body
    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }

    const User = await user.findOne({
        $or: [{ username }, { email }]
    })

    if (!User) {
        throw new ApiError(404, "User does not exist")
    }

    const passwordvalid = await User.checkpassword(password)
    if (!passwordvalid) {
        throw new ApiError(401, "Password is incorrect")
    }

    const { accesstoken, refreshtoken } = await generatetokens(User._id)

    const loggedinUser = await user.findById(User._id).select("-password -RefreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("AccessToken", accesstoken, options)
        .cookie("RefreshToken", refreshtoken, options)
        .json(
            new apiresponse(
                200,
                {
                    user: loggedinUser, accesstoken, refreshtoken
                },
                "User logged in successfully"
            )
        )
})

const logoutuser = asynchandler(async (req, res) => {
    await user.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                RefreshToken: 1
            }
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("AccessToken", options)
        .clearCookie("RefreshToken", options)
        .json(new apiresponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asynchandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.RefreshToken || req.body.refreshtoken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const User = await user.findById(decoded._id)
        if (!User) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== User?.RefreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accesstoken, refreshtoken: newrefreshtoken } = await generatetokens(User._id)

        return res
            .status(200)
            .cookie("AccessToken", accesstoken, options)
            .cookie("RefreshToken", newrefreshtoken, options)
            .json(
                new apiresponse(
                    200,
                    { accesstoken, refreshtoken: newrefreshtoken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changepassword = asynchandler(async (req, res) => {
    const { oldpassword, newpassword } = req.body
    if (!oldpassword || !newpassword) {
        throw new ApiError(400, "Both passwords are required")
    }
    const User = await user.findById(req.user?._id)
    if (!User) {
        throw new ApiError(404, "User not found")
    }
    const ispasswordcorrect = await User.checkpassword(oldpassword)
    if (!ispasswordcorrect) {
        throw new ApiError(400, "Enter correct password")
    }
    User.password = newpassword
    await User.save({ validateBeforeSave: false })

    return res.status(200).json(new apiresponse(200, {}, "password changed successfully"))
})

const getcurrentuser = asynchandler(async (req, res) => {
    return res.status(200).json(new apiresponse(200, req.user, "Current user fetched successfully"))
})

const updateuserdetails = asynchandler(async (req, res) => {
    const { username, email } = req.body

    if (!username && !email) {
        throw new ApiError(400, "Enter details to change")
    }

    const updated = {}

    if (username) updated.username = username
    if (email) updated.email = email

    const User = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updated
        },
        {
            returnDocument: "after"
        }
    ).select("-password")

    return res.status(200).json(new apiresponse(200, User, "Account details updated successfully"))

})


export { registeruser, loginuser, logoutuser, refreshAccessToken, changepassword, getcurrentuser, updateuserdetails }