import { watchHistory } from "../models/watchHistory.models.js"
import asynchandler from "../utils/asynchandler.js"
import apiresponse from "../utils/apiresponse.js"
import mongoose from "mongoose"
import ApiError from "../utils/apierror.js"

const givewatchHistory = asynchandler(async (req, res) => {

    const history = await watchHistory.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $sort: {
                watchedAt: -1
            }
        },
        {
            $lookup: {
                from: "movies",
                localField: "movie",
                foreignField: "_id",
                as: "movieDetails"
            }
        },
        {
            $unwind: "$movieDetails"
        },
       {
    $project: {
        progress: 1,
        watchedAt: 1,
        "movieDetails._id": 1,
        "movieDetails.title": 1,
        "movieDetails.poster": 1,
        "movieDetails.genre": 1
    }
}

    ])

    return res.status(200).json(
        new apiresponse(200, history, "Watch history fetched successfully")
    )
})

const updateWatchHistory = asynchandler(async (req, res) => {
    const { movieId, progress } = req.body

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        throw new ApiError(400, "Invalid movie id")
    }

    if (typeof progress !== "number" || progress < 0 || progress > 100) {
        throw new ApiError(
            400,
            "Progress must be between 0 and 100"
        )
    }

    const history = await watchHistory.findOneAndUpdate(
        {
            user: req.user._id,
            movie: movieId
        },
        {
            progress,
            watchedAt: new Date()
        },
        {
            upsert: true,
            returnDocument: "after"
        }
    )

    return res.status(200).json(new apiresponse(200, history, "Watch History updated successfully"))
})

const deleteWatchHistory = asynchandler(async (req, res) => {
    const { movieId } = req.params
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        throw new ApiError(400, "Invalid movie id")
    }
    const history = await watchHistory.findOneAndDelete(
        {
            user: req.user._id,
            movie: movieId
        }
    )
    return res.status(200).json(new apiresponse(200, history, "Deleted successfully"))
})

const getContinueWatching = asynchandler(async (req, res) => {

    const continueWatching = await watchHistory.aggregate([

        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
                progress: { $lt: 99 }
            }
        },

        {
            $sort: {
                watchedAt: -1
            }
        },

        {
            $limit: 20
        },

        {
            $lookup: {
                from: "movies",
                localField: "movie",
                foreignField: "_id",
                as: "movieDetails"
            }
        },

        {
            $unwind: "$movieDetails"
        },

        {
            $project: {

                progress: 1,
                watchedAt: 1,

                movie: {
                    _id: "$movieDetails._id",
                    title: "$movieDetails.title",
                    poster: "$movieDetails.poster",
                    genre: "$movieDetails.genre",
                    year: "$movieDetails.year",
                    type: "$movieDetails.type"
                }
            }
        }

    ])

    return res.status(200).json(
        new apiresponse(
            200,
            continueWatching,
            "Continue watching fetched successfully"
        )
    )
})

export { givewatchHistory, updateWatchHistory, deleteWatchHistory, getContinueWatching }