import asynchandler from "../utils/asynchandler.js"
import apiresponse from "../utils/apiresponse.js"
import ApiError from "../utils/apierror.js"
import parseMovieId from "../utils/movieId.js"
import { favourite } from "../models/favourite.models.js"
import { getMovieSummary } from "../services/tmdb.service.js"
import { enrichLibraryEntries } from "../services/library.service.js"

const getfavourites = asynchandler(async (req, res) => {
    const favourites = await favourite.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(200)

    const movies = await enrichLibraryEntries(
        favourites,
        (movie, entry) => ({
            ...movie,
            favouritedAt: entry.createdAt
        })
    )

    return res.status(200).json(
        new apiresponse(200, movies, "Favourites fetched successfully")
    )
})

const addfavourite = asynchandler(async (req, res) => {
    const movieId = parseMovieId(req.body?.movieId)
    const movie = await getMovieSummary(movieId)

    let savedFavourite

    try {
        savedFavourite = await favourite.findOneAndUpdate(
            {
                user: req.user._id,
                movieId
            },
            {
                $setOnInsert: {
                    user: req.user._id,
                    movieId
                }
            },
            {
                upsert: true,
                returnDocument: "after",
                setDefaultsOnInsert: true
            }
        )
    } catch (error) {
        if (error.code === 11000) {
            savedFavourite = await favourite.findOne({
                user: req.user._id,
                movieId
            })
        } else {
            throw error
        }
    }

    return res.status(200).json(
        new apiresponse(
            200,
            {
                ...movie,
                favouritedAt: savedFavourite?.createdAt || new Date()
            },
            "Movie added to favourites"
        )
    )
})

const removefavourite = asynchandler(async (req, res) => {
    const movieId = parseMovieId(req.params.movieId)

    const removed = await favourite.findOneAndDelete({
        user: req.user._id,
        movieId
    })

    if (!removed) {
        throw new ApiError(404, "Movie is not in favourites")
    }

    return res.status(200).json(
        new apiresponse(200, { movieId }, "Movie removed from favourites")
    )
})

const checkfavourite = asynchandler(async (req, res) => {
    const movieId = parseMovieId(req.params.movieId)

    const savedFavourite = await favourite.exists({
        user: req.user._id,
        movieId
    })

    return res.status(200).json(
        new apiresponse(
            200,
            {
                movieId,
                isFavourite: Boolean(savedFavourite)
            },
            "Favourite status fetched successfully"
        )
    )
})

export {
    getfavourites,
    addfavourite,
    removefavourite,
    checkfavourite
}
