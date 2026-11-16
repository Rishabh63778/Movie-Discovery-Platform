import asynchandler from "../utils/asynchandler.js"
import apiresponse from "../utils/apiresponse.js"
import ApiError from "../utils/apierror.js"
import parseMovieId from "../utils/movieId.js"
import { watchHistory } from "../models/watchHistory.models.js"
import { enrichLibraryEntries } from "../services/library.service.js"

const MIN_PROGRESS = 0
const MAX_PROGRESS = 100
const MAX_LIBRARY_ITEMS = 200

const getwatchhistory = asynchandler(async (req, res) => {
    const history = await watchHistory.find({ user: req.user._id })
        .sort({ watchedAt: -1 })
        .limit(MAX_LIBRARY_ITEMS)

    const movies = await enrichLibraryEntries(
        history,
        (movie, entry) => ({
            ...movie,
            progress: entry.progress,
            watchedAt: entry.watchedAt,
            completed: entry.progress >= 99
        })
    )

    return res.status(200).json(
        new apiresponse(200, movies, "Watch history fetched successfully")
    )
})

const getcontinuewatching = asynchandler(async (req, res) => {
    const history = await watchHistory.find({
        user: req.user._id,
        progress: { $lt: 99 }
    })
        .sort({ watchedAt: -1 })
        .limit(20)

    const movies = await enrichLibraryEntries(
        history,
        (movie, entry) => ({
            ...movie,
            progress: entry.progress,
            watchedAt: entry.watchedAt
        })
    )

    return res.status(200).json(
        new apiresponse(200, movies, "Continue watching fetched successfully")
    )
})

const updatewatchhistory = asynchandler(async (req, res) => {
    const movieId = parseMovieId(req.body?.movieId)
    const progress = req.body?.progress

    if (
        typeof progress !== "number" ||
        !Number.isFinite(progress) ||
        progress < MIN_PROGRESS ||
        progress > MAX_PROGRESS
    ) {
        throw new ApiError(400, "Progress must be a number between 0 and 100")
    }

    const watchedAt = new Date()

    let history

    try {
        history = await watchHistory.findOneAndUpdate(
            {
                user: req.user._id,
                movieId
            },
            {
                $set: {
                    progress,
                    watchedAt
                },
                $setOnInsert: {
                    user: req.user._id,
                    movieId
                }
            },
            {
                upsert: true,
                returnDocument: "after",
                runValidators: true,
                setDefaultsOnInsert: true
            }
        )
    } catch (error) {
        if (error.code === 11000) {
            history = await watchHistory.findOneAndUpdate(
                {
                    user: req.user._id,
                    movieId
                },
                {
                    $set: {
                        progress,
                        watchedAt
                    }
                },
                {
                    returnDocument: "after",
                    runValidators: true
                }
            )
        } else {
            throw error
        }
    }

    return res.status(200).json(
        new apiresponse(
            200,
            {
                movieId: history.movieId,
                progress: history.progress,
                watchedAt: history.watchedAt
            },
            "Watch history updated successfully"
        )
    )
})

const deletewatchhistory = asynchandler(async (req, res) => {
    const movieId = parseMovieId(req.params.movieId)

    const removed = await watchHistory.findOneAndDelete({
        user: req.user._id,
        movieId
    })

    if (!removed) {
        throw new ApiError(404, "Movie is not in watch history")
    }

    return res.status(200).json(
        new apiresponse(200, { movieId }, "Movie removed from watch history")
    )
})

export {
    getwatchhistory,
    getcontinuewatching,
    updatewatchhistory,
    deletewatchhistory
}
