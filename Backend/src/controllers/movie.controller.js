import asynchandler from "../utils/asynchandler.js"
import apiresponse from "../utils/apiresponse.js"
import ApiError from "../utils/apierror.js"
import parseMovieId from "../utils/movieId.js"
import {
    getGenres,
    resolveGenreId,
    getMoviesByCategory,
    searchMovies,
    discoverMoviesByGenre,
    getMovieDetails
} from "../services/tmdb.service.js"

const MAX_PAGE = 500

const parsePage = (value) => {
    const page = Number.parseInt(value, 10)

    if (!Number.isFinite(page) || page < 1) return 1

    return Math.min(page, MAX_PAGE)
}

const getallmovies = asynchandler(async (req, res) => {
    const page = parsePage(req.query.page)
    const genre = typeof req.query.genre === "string" ? req.query.genre.trim() : ""
    const category = typeof req.query.category === "string" && req.query.category.trim()
        ? req.query.category.trim().toLowerCase()
        : "trending"

    const movies = genre
        ? await discoverMoviesByGenre(await resolveGenreId(genre), page)
        : await getMoviesByCategory(category, page)

    return res.status(200).json(
        new apiresponse(200, movies, "Movies fetched successfully")
    )
})

const getmovie = asynchandler(async (req, res) => {
    const movieId = parseMovieId(req.params.movieId)
    const movie = await getMovieDetails(movieId)

    return res.status(200).json(
        new apiresponse(200, movie, "Movie found successfully")
    )
})

const searchmovie = asynchandler(async (req, res) => {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : ""

    if (!query) {
        throw new ApiError(400, "Search query is required")
    }

    const movies = await searchMovies(query, parsePage(req.query.page))

    return res.status(200).json(
        new apiresponse(200, movies, "Movies found")
    )
})

const getgenres = asynchandler(async (req, res) => {
    const genres = await getGenres()

    return res.status(200).json(
        new apiresponse(200, genres, "Genres fetched successfully")
    )
})

export {
    getallmovies,
    getmovie,
    searchmovie,
    getgenres
}
