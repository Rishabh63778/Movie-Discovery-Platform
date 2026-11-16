import ApiError from "./apierror.js"

const parseMovieId = (value) => {
    if (!/^\d+$/.test(String(value || ""))) {
        throw new ApiError(400, "Invalid movie id")
    }

    const movieId = Number(value)

    if (!Number.isSafeInteger(movieId) || movieId < 1) {
        throw new ApiError(400, "Invalid movie id")
    }

    return movieId
}

export default parseMovieId
