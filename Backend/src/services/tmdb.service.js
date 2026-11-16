import ApiError from "../utils/apierror.js"

const TMDB_API_BASE = (process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3").replace(/\/$/, "")
const TMDB_IMAGE_BASE = (process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/").replace(/\/?$/, "/")
const TMDB_LANGUAGE = process.env.TMDB_LANGUAGE || "en-US"
const REQUEST_TIMEOUT_MS = 10000

const LIST_TTL_MS = 5 * 60 * 1000
const DETAIL_TTL_MS = 5 * 60 * 1000
const GENRE_TTL_MS = 24 * 60 * 60 * 1000
const MAX_CACHE_ENTRIES = 250

const MOVIE_CATEGORIES = {
    trending: "/trending/movie/week",
    popular: "/movie/popular",
    top_rated: "/movie/top_rated",
    upcoming: "/movie/upcoming",
    now_playing: "/movie/now_playing"
}

const responseCache = new Map()
let genreCache = null

const getAccessToken = () => {
    const token = process.env.TMDB_ACCESS_TOKEN

    if (!token) {
        throw new ApiError(500, "TMDB access token is not configured")
    }

    return token
}

const getCached = (key) => {
    const entry = responseCache.get(key)

    if (!entry) return null

    if (entry.expiresAt <= Date.now()) {
        responseCache.delete(key)
        return null
    }

    return entry.value
}

const setCached = (key, value, ttl) => {
    if (responseCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = responseCache.keys().next().value
        if (oldestKey) responseCache.delete(oldestKey)
    }

    responseCache.set(key, {
        value,
        expiresAt: Date.now() + ttl
    })
}

const buildQuery = (params = {}) => {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, String(value))
        }
    })

    return query.toString()
}

const requestTmdb = async (path, params = {}, ttl = LIST_TTL_MS) => {
    const query = buildQuery({
        ...params,
        language: params.language || TMDB_LANGUAGE
    })

    const cacheKey = `${path}?${query}`
    const cached = getCached(cacheKey)

    if (cached) return cached

    const accessToken = getAccessToken()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    let response

    try {
        response = await fetch(`${TMDB_API_BASE}${path}?${query}`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            signal: controller.signal
        })
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }

        if (error.name === "AbortError") {
            throw new ApiError(504, "TMDB request timed out")
        }

        throw new ApiError(502, "Unable to connect to TMDB")
    } finally {
        clearTimeout(timeout)
    }

    let payload = null

    try {
        payload = await response.json()
    } catch {
        payload = null
    }

    if (!response.ok) {
        if (response.status === 404) {
            throw new ApiError(404, "Movie not found")
        }

        if (response.status === 401) {
            throw new ApiError(502, "TMDB authentication failed. Check TMDB_ACCESS_TOKEN")
        }

        if (response.status === 429) {
            throw new ApiError(503, "TMDB rate limit reached. Please try again shortly")
        }

        throw new ApiError(
            response.status >= 500 ? 502 : response.status,
            payload?.status_message || `TMDB request failed with status ${response.status}`
        )
    }

    if (!payload) {
        throw new ApiError(502, "TMDB returned an invalid response")
    }

    setCached(cacheKey, payload, ttl)

    return payload
}

const getImage = (path, size) => {
    if (!path) return null

    return {
        path,
        url: `${TMDB_IMAGE_BASE}${size}${path}`
    }
}

const getYear = (releaseDate) => {
    if (!releaseDate) return null

    const year = Number(releaseDate.slice(0, 4))

    return Number.isFinite(year) ? year : null
}

const getRating = (rating) => {
    const numeric = Number(rating)

    if (!Number.isFinite(numeric)) return 0

    return Number(numeric.toFixed(1))
}

const normalizeMovie = (raw = {}, genreMap = new Map()) => {
    const rawGenres = Array.isArray(raw.genres) ? raw.genres : null
    const genreIds = Array.isArray(raw.genre_ids)
        ? raw.genre_ids
        : (rawGenres || []).map((genre) => genre.id)

    const genres = rawGenres?.length
        ? rawGenres
            .filter((genre) => genre?.id && genre?.name)
            .map((genre) => ({ id: genre.id, name: genre.name }))
        : genreIds
            .map((id) => ({ id, name: genreMap.get(id) }))
            .filter((genre) => genre.name)

    const poster = getImage(raw.poster_path, "w500")
    const backdrop = getImage(raw.backdrop_path, "w1280")

    return {
        id: raw.id,
        title: raw.title || raw.original_title || "Untitled",
        originalTitle: raw.original_title || null,
        description: raw.overview || "No description available.",
        overview: raw.overview || "",
        poster,
        backdrop,
        posterUrl: poster?.url || null,
        backdropUrl: backdrop?.url || null,
        releaseDate: raw.release_date || null,
        year: getYear(raw.release_date),
        rating: getRating(raw.vote_average),
        voteCount: raw.vote_count || 0,
        popularity: raw.popularity ?? null,
        originalLanguage: raw.original_language || null,
        adult: Boolean(raw.adult),
        genreIds,
        genres,
        genre: genres.map((genre) => genre.name),
        type: "movie"
    }
}

const normalizeList = (payload = {}, genreMap = new Map()) => ({
    results: Array.isArray(payload.results)
        ? payload.results.map((movie) => normalizeMovie(movie, genreMap))
        : [],
    page: payload.page || 1,
    totalPages: Math.min(payload.total_pages || 0, 500),
    totalResults: payload.total_results || 0
})

const getGenreMap = async () => {
    if (genreCache && genreCache.expiresAt > Date.now()) {
        return genreCache.data
    }

    const payload = await requestTmdb("/genre/movie/list", {}, GENRE_TTL_MS)
    const map = new Map(
        (payload.genres || [])
            .filter((genre) => genre?.id && genre?.name)
            .map((genre) => [genre.id, genre.name])
    )

    genreCache = {
        data: map,
        expiresAt: Date.now() + GENRE_TTL_MS
    }

    return map
}

const getGenres = async () => {
    const genreMap = await getGenreMap()

    return Array.from(genreMap.entries()).map(([id, name]) => ({ id, name }))
}

const resolveGenreId = async (genre) => {
    const value = String(genre || "").trim()

    if (!value) {
        throw new ApiError(400, "Genre is required")
    }

    const genres = await getGenres()

    if (/^\d+$/.test(value)) {
        const numericId = Number(value)
        const matchingGenre = genres.find((item) => item.id === numericId)

        if (!matchingGenre) {
            throw new ApiError(400, `Unknown genre: ${value}`)
        }

        return numericId
    }

    const matchingGenre = genres.find(
        (item) => item.name.toLowerCase() === value.toLowerCase()
    )

    if (!matchingGenre) {
        throw new ApiError(400, `Unknown genre: ${value}`)
    }

    return matchingGenre.id
}

const getMoviesByCategory = async (category, page) => {
    const endpoint = MOVIE_CATEGORIES[category]

    if (!endpoint) {
        throw new ApiError(
            400,
            `Invalid category. Use one of: ${Object.keys(MOVIE_CATEGORIES).join(", ")}`
        )
    }

    const [payload, genreMap] = await Promise.all([
        requestTmdb(endpoint, { page }, LIST_TTL_MS),
        getGenreMap()
    ])

    return {
        ...normalizeList(payload, genreMap),
        category
    }
}

const searchMovies = async (query, page) => {
    const cleanQuery = String(query || "").trim()

    if (!cleanQuery) {
        throw new ApiError(400, "Search query is required")
    }

    const [payload, genreMap] = await Promise.all([
        requestTmdb(
            "/search/movie",
            {
                query: cleanQuery,
                page,
                include_adult: false
            },
            LIST_TTL_MS
        ),
        getGenreMap()
    ])

    return {
        ...normalizeList(payload, genreMap),
        query: cleanQuery
    }
}

const discoverMoviesByGenre = async (genreId, page) => {
    const [payload, genreMap] = await Promise.all([
        requestTmdb(
            "/discover/movie",
            {
                with_genres: genreId,
                sort_by: "popularity.desc",
                include_adult: false,
                page
            },
            LIST_TTL_MS
        ),
        getGenreMap()
    ])

    return {
        ...normalizeList(payload, genreMap),
        genreId
    }
}

const normalizeVideo = (video) => ({
    id: video.id,
    key: video.key,
    name: video.name || "Video",
    site: video.site,
    type: video.type,
    official: Boolean(video.official),
    url: video.site === "YouTube"
        ? `https://www.youtube.com/watch?v=${video.key}`
        : null
})

const getMovieDetails = async (movieId) => {
    const [payload, genreMap] = await Promise.all([
        requestTmdb(
            `/movie/${movieId}`,
            {
                append_to_response: "credits,videos,similar,recommendations"
            },
            DETAIL_TTL_MS
        ),
        getGenreMap()
    ])

    const movie = normalizeMovie(payload, genreMap)
    const cast = (payload.credits?.cast || []).slice(0, 20).map((member) => ({
        id: member.id,
        actor: member.name,
        character: member.character || "",
        profile: getImage(member.profile_path, "w185"),
        order: member.order
    }))

    const crew = payload.credits?.crew || []
    const directors = Array.from(new Set(
        crew.filter((member) => member.job === "Director").map((member) => member.name)
    ))
    const writers = Array.from(new Set(
        crew
            .filter((member) => ["Screenplay", "Writer", "Story"].includes(member.job))
            .map((member) => member.name)
    ))

    const videos = (payload.videos?.results || [])
        .filter((video) => video.site === "YouTube")
        .map(normalizeVideo)

    const trailer = videos.find(
        (video) => video.type === "Trailer" && video.official
    ) || videos.find(
        (video) => video.type === "Trailer"
    ) || videos.find(
        (video) => video.type === "Teaser"
    ) || null

    const collection = payload.belongs_to_collection
        ? {
            id: payload.belongs_to_collection.id,
            name: payload.belongs_to_collection.name,
            poster: getImage(payload.belongs_to_collection.poster_path, "w500"),
            backdrop: getImage(payload.belongs_to_collection.backdrop_path, "w1280")
        }
        : null

    return {
        ...movie,
        tagline: payload.tagline || "",
        status: payload.status || null,
        duration: payload.runtime || null,
        runtime: payload.runtime || null,
        homepage: payload.homepage || null,
        imdbId: payload.imdb_id || null,
        budget: payload.budget || 0,
        revenue: payload.revenue || 0,
        spokenLanguages: (payload.spoken_languages || [])
            .map((language) => language.english_name || language.name)
            .filter(Boolean),
        productionCompanies: (payload.production_companies || []).map((company) => ({
            id: company.id,
            name: company.name,
            logo: getImage(company.logo_path, "w92")
        })),
        collection,
        cast,
        crew: {
            directors,
            writers
        },
        trailer,
        videos,
        similar: (payload.similar?.results || [])
            .slice(0, 12)
            .map((item) => normalizeMovie(item, genreMap)),
        recommendations: (payload.recommendations?.results || [])
            .slice(0, 12)
            .map((item) => normalizeMovie(item, genreMap))
    }
}

const getMovieSummary = async (movieId) => {
    const [payload, genreMap] = await Promise.all([
        requestTmdb(`/movie/${movieId}`, {}, DETAIL_TTL_MS),
        getGenreMap()
    ])

    return normalizeMovie(payload, genreMap)
}

export {
    MOVIE_CATEGORIES,
    getGenres,
    resolveGenreId,
    getMoviesByCategory,
    searchMovies,
    discoverMoviesByGenre,
    getMovieDetails,
    getMovieSummary
}
