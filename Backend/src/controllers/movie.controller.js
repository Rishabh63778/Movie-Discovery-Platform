import { movie } from "../models/movie.models.js"
import asynchandler from "../utils/asynchandler.js"
import apiresponse from "../utils/apiresponse.js"
import ApiError from "../utils/apierror.js"
import mongoose from "mongoose"
import uploadoncloudinary from "../utils/cloudinary.js"
import cloudinary from "cloudinary"

const addmovie = asynchandler(async (req, res) => {

    const { title, type, description, year, rating, cast, duration, genre, seasons, episodes } = req.body

    if (!(title && type && description && year && genre)) {
        throw new ApiError(400, "Required fields missing")
    }

    if (title?.trim() === "" || description?.trim() === "" || type?.trim() === "") {
        throw new ApiError(400, "Invalid movie data")
    }

    const movieExists = await movie.findOne({ title, year })

    if (movieExists) {
        throw new ApiError(400, "Movie already exists")
    }

    const posterLocalPath = req.file?.path

    if (!posterLocalPath) {
        throw new ApiError(400, "Poster is required")
    }

    const poster = await uploadoncloudinary(posterLocalPath)

    if (!poster) {
        throw new ApiError(500, "Poster upload failed")
    }

    const parsedCast = cast ? JSON.parse(cast) : []
    const parsedGenre = genre ? JSON.parse(genre) : []

    const Movie = await movie.create({
        title,
        poster: { url: poster.secure_url, public_id: poster.public_id },
        type,
        description,
        year,
        rating,
        cast: parsedCast,
        genre: parsedGenre,
        duration,
        seasons,
        episodes
    })

    const createdmovie = await movie.findById(Movie._id)

    if (!createdmovie) {
        throw new ApiError(500, "Couldn't add movie")
    }

    return res.status(201).json(
        new apiresponse(
            201,
            createdmovie,
            "Movie added successfully"
        )
    )
})

const getallmovies = asynchandler(async (req, res) => {

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const { genre } = req.query

    const matchstage = {}

    if (genre?.trim()) {

        matchstage.genre = genre
    }

    const aggregate = movie.aggregate([
        {
            $match: matchstage
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                title: 1,
                rating: 1,
                year: 1,
                poster:1,
                cast: 1,
                rating: 1,
                description: 1,
                genre: 1,
                type: 1,
            }
        }
    ])

    const options = {
        page,
        limit
    }

    const movies = await movie.aggregatePaginate(
        aggregate,
        options
    )

    return res.status(200).json(
        new apiresponse(
            200,
            movies,
            "Movies fetched successfully"
        )
    )
})

const getmovie = asynchandler(async (req, res) => {
    const { movieId } = req.params
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        throw new ApiError(400, "Invalid movie id")
    }
    const Movie = await movie.findById(movieId)
    if (!Movie) {
        throw new ApiError(404, "Movie not found")
    }
    return res.status(200).json(
        new apiresponse(
            200,
            Movie,
            "Movie found successfully"
        )
    )
})

const updatemovie = asynchandler(async (req, res) => {
    const { movieId } = req.params

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        throw new ApiError(400, "Invalid movie id")
    }

    const { title, type, description, year, rating, cast, duration, genre, seasons, episodes } = req.body

    const updated = {}

    if (title !== undefined) {

        if (!title.trim()) {
            throw new ApiError(400, "Title cannot be empty")
        }

        updated.title = title
    }

    if (genre !== undefined) {
        updated.genre = genre
    }

    if (duration !== undefined) {
        updated.duration = duration
    }

    if (cast !== undefined) {

        try {
            updated.cast = JSON.parse(cast)
        } catch (error) {
            throw new ApiError(400, "Invalid cast format")
        }
    }

    if (description !== undefined) {

        if (!description.trim()) {
            throw new ApiError(400, "Description cannot be empty")
        }

        updated.description = description
    }

    if (rating !== undefined) {

        const numericRating = Number(rating)

        if (isNaN(numericRating)) {
            throw new ApiError(400, "Invalid rating")
        }

        if (numericRating < 0 || numericRating > 10) {
            throw new ApiError(400, "Rating must be between 0 and 10")
        }

        updated.rating = numericRating
    }

    if (seasons !== undefined) {
        updated.seasons = seasons
    }
    if (episodes !== undefined) {
        updated.episodes = episodes
    }

    if (year !== undefined) {
        updated.year = year
    }

    if (type !== undefined) {

        if (!type.trim()) {
            throw new ApiError(400, "Type cannot be empty")
        }

        updated.type = type
    }

    const existingMovie = await movie.findById(movieId)

    if (!existingMovie) {
        throw new ApiError(404, "Movie not found")
    }

    const posterLocalPath = req.file?.path

    let oldPublicId = null

    if (posterLocalPath) {

        const poster = await uploadoncloudinary(posterLocalPath)

        if (!poster) {
            throw new ApiError(500, "Poster upload failed")
        }

        oldPublicId = existingMovie.poster.public_id

        updated.poster = {
            url: poster.secure_url,
            public_id: poster.public_id
        }
    }

    if (Object.keys(updated).length === 0) {
        throw new ApiError(400, "No fields provided for update")
    }

    const Movie = await movie.findByIdAndUpdate(
        movieId,
        {
            $set: updated
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    )

    if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId)
    }

    return res.status(200).json(
        new apiresponse(
            200,
            Movie,
            "Movie details updated successfully"
        )
    )
})

const deletemovie = asynchandler(async (req, res) => {
    const { movieId } = req.params

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        throw new ApiError(400, "Invalid movie Id")
    }

    const Movie = await movie.findById(movieId)

    if (!Movie) {
        throw new ApiError(404, "Movie not found")
    }

    if (Movie.poster?.public_id) {
        await cloudinary.uploader.destroy(Movie.poster.public_id)
    }

    if (Movie.video?.public_id) {
        await cloudinary.uploader.destroy(Movie.video.public_id)
    }

    await movie.findByIdAndDelete(movieId)

    return res.status(200).json(
        new apiresponse(
            200,
            Movie,
            "Movie deleted successfully"
        )
    )
})

const searchmovie = asynchandler(async (req, res) => {
    const { query } = req.query

    if (!query?.trim()) {
        throw new ApiError(400, "Search query is required")
    }

    const cleanquery = query.trim()

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const aggregate = movie.aggregate([
        {
            $match: {
                $or: [
                    {
                        title: {
                            $regex: cleanquery,
                            $options: "i"
                        }
                    },
                    {
                        genre: {
                            $regex: cleanquery,
                            $options: "i"
                        }
                    }
                ]
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                title: 1,
                year: 1,
                rating: 1,
                duration: 1,
                genre: 1,
                type: 1,
                poster: 1,
                video: 1
            }
        }
    ])

    const options = {
        page,
        limit
    }

    const movies = await movie.aggregatePaginate(aggregate, options)


    res.status(200).json(new apiresponse(200, movies, "Movies found"))
})

const uploadMovieVideo = asynchandler(async (req, res) => {

    const { movieId } = req.params

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        throw new ApiError(400, "Invalid movie id")
    }

    const Movie = await movie.findById(movieId)

    if (!Movie) {
        throw new ApiError(404, "Movie not found")
    }

    const videoLocalPath = req.file?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file missing")
    }

    const uploadedVideo = await uploadoncloudinary(videoLocalPath)

    if (!uploadedVideo) {
        throw new ApiError(500, "Video upload failed")
    }

    const updatedMovie = await movie.findByIdAndUpdate(
        movieId,
        {
            $set: {
                video: {
                    url: uploadedVideo.secure_url,
                    public_id: uploadedVideo.public_id,
                    duration: uploadedVideo.duration,
                    format: uploadedVideo.format,
                    bytes: uploadedVideo.bytes
                }
            }
        },
        {
            returnDocument: "after"
        }
    )

    return res.status(200).json(
        new apiresponse(
            200,
            updatedMovie,
            "Video uploaded successfully"
        )
    )
})

const deleteMovieVideo = asynchandler(async (req, res) => {

    const { movieId } = req.params

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        throw new ApiError(400, "Invalid movie Id")
    }

    const Movie = await movie.findById(movieId)

    if (!Movie) {
        throw new ApiError(404, "Movie not found")
    }

    if (!Movie.video?.public_id) {
        throw new ApiError(400, "Movie video not found")
    }

    await cloudinary.uploader.destroy(
        Movie.video.public_id,
        {
            resource_type: "video"
        }
    )

    const updatedMovie = await movie.findByIdAndUpdate(
        movieId,
        {
            $unset: {
                video: 1
            }
        },
        {
            returnDocument: "after"
        }
    )

    return res.status(200).json(
        new apiresponse(
            200,
            updatedMovie,
            "Video deleted successfully"
        )
    )
})

export {
    addmovie,
    getallmovies,
    getmovie,
    updatemovie,
    deletemovie,
    searchmovie,
    uploadMovieVideo,
    deleteMovieVideo
}