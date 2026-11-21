import ApiError from "../utils/apierror.js"
import { getAwardsForWikidataId } from "./awards.service.js"

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
let tvGenreCache = null

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

const normalizeTv = (raw = {}, genreMap = new Map()) => {
    const genreIds = Array.isArray(raw.genre_ids)
        ? raw.genre_ids
        : (raw.genres || []).map((genre) => genre.id)

    const genres = genreIds
        .map((id) => ({ id, name: genreMap.get(id) }))
        .filter((genre) => genre.name)

    const poster = getImage(raw.poster_path, "w500")
    const backdrop = getImage(raw.backdrop_path, "w1280")
    const firstAirDate = raw.first_air_date || null

    return {
        id: raw.id,
        title: raw.name || raw.original_name || "Untitled",
        originalTitle: raw.original_name || null,
        description: raw.overview || "No description available.",
        overview: raw.overview || "",
        poster,
        backdrop,
        posterUrl: poster?.url || null,
        backdropUrl: backdrop?.url || null,
        releaseDate: firstAirDate,
        year: getYear(firstAirDate),
        rating: getRating(raw.vote_average),
        voteCount: raw.vote_count || 0,
        popularity: raw.popularity ?? null,
        originalLanguage: raw.original_language || null,
        adult: Boolean(raw.adult),
        genreIds,
        genres,
        genre: genres.map((genre) => genre.name),
        type: "tv"
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

const getTvGenreMap = async () => {
    if (tvGenreCache && tvGenreCache.expiresAt > Date.now()) {
        return tvGenreCache.data
    }

    const payload = await requestTmdb("/genre/tv/list", {}, GENRE_TTL_MS)
    const map = new Map(
        (payload.genres || [])
            .filter((genre) => genre?.id && genre?.name)
            .map((genre) => [genre.id, genre.name])
    )

    tvGenreCache = {
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

const normalizePersonSummary = (raw = {}) => {
    const profile = getImage(raw.profile_path, "w185")

    const knownFor = (Array.isArray(raw.known_for) ? raw.known_for : [])
        .filter((item) => item?.id)
        .map((item) => {
            const isTv = item.media_type === "tv" || (!item.title && Boolean(item.name))
            const poster = getImage(item.poster_path, "w185")

            return {
                id: item.id,
                title: item.title || item.name || "Untitled",
                year: getYear(item.release_date || item.first_air_date),
                type: isTv ? "tv" : "movie",
                poster,
                posterUrl: poster?.url || null,
                rating: getRating(item.vote_average)
            }
        })

    return {
        id: raw.id,
        name: raw.name || "Unknown person",
        profile,
        profileUrl: profile?.url || null,
        knownForDepartment: raw.known_for_department || null,
        popularity: raw.popularity ?? null,
        adult: Boolean(raw.adult),
        knownFor,
        knownForText: knownFor
            .slice(0, 3)
            .map((item) => item.title)
            .join(", "),
        type: "person"
    }
}

const searchMulti = async (query, page) => {
    const cleanQuery = String(query || "").trim()

    if (!cleanQuery) {
        throw new ApiError(400, "Search query is required")
    }

    const [payload, movieGenreMap, tvGenreMap] = await Promise.all([
        requestTmdb(
            "/search/multi",
            {
                query: cleanQuery,
                page,
                include_adult: false
            },
            LIST_TTL_MS
        ),
        getGenreMap().catch(() => new Map()),
        getTvGenreMap().catch(() => new Map())
    ])

    const movies = []
    const tv = []
    const people = []
    const results = []

    ;(payload.results || []).forEach((item) => {
        if (item.media_type === "movie") {
            const normalized = normalizeMovie(item, movieGenreMap)
            movies.push(normalized)
            results.push(normalized)
            return
        }

        if (item.media_type === "tv") {
            const normalized = normalizeTv(item, tvGenreMap)
            tv.push(normalized)
            results.push(normalized)
            return
        }

        if (item.media_type === "person") {
            const normalized = normalizePersonSummary(item)
            people.push(normalized)
            results.push(normalized)
        }
    })

    return {
        query: cleanQuery,
        page: payload.page || page || 1,
        totalPages: Math.min(payload.total_pages || 0, 500),
        totalResults: payload.total_results || 0,
        results,
        movies,
        tv,
        people,
        counts: {
            movies: movies.length,
            tv: tv.length,
            people: people.length,
            total: results.length
        }
    }
}

const normalizeCrewMember = (member = {}) => {
    const profile = getImage(member.profile_path, "w185")

    return {
        id: member.id,
        name: member.name || "Unknown",
        job: member.job || null,
        department: member.department || null,
        profile,
        profileUrl: profile?.url || null
    }
}

const buildDirectors = (crew = []) => {
    const seen = new Set()
    const directors = []

    crew.forEach((member) => {
        if (member.job !== "Director" || !member.id || seen.has(member.id)) return

        seen.add(member.id)
        directors.push(normalizeCrewMember(member))
    })

    return directors
}

const KEY_CREW_WRITING_JOBS = new Set([
    "Screenplay",
    "Writer",
    "Story",
    "Teleplay",
    "Screenstory",
    "Adaptation",
    "Dialogue",
    "Scenario",
    "Script",
    "Script Editor"
])

const KEY_CREW_JOBS = [
    "Screenplay",
    "Writer",
    "Story",
    "Teleplay",
    "Screenstory",
    "Adaptation",
    "Dialogue",
    "Scenario",
    "Script",
    "Script Editor",
    "Producer",
    "Executive Producer",
    "Director of Photography",
    "Original Music Composer",
    "Editor",
    "Production Designer",
    "Casting"
]

const buildKeyCrew = (crew = [], excludedIds = new Set()) => {
    const seen = new Set()
    const keyCrew = []

    KEY_CREW_JOBS.forEach((job) => {
        crew.forEach((member) => {
            if (member.job !== job || !member.id || seen.has(member.id)) return

            const isWritingJob = KEY_CREW_WRITING_JOBS.has(job)

            // Directors get their own section, but writer-directors still
            // belong in Key Crew because their writing credit matters.
            if (!isWritingJob && excludedIds.has(member.id)) return

            seen.add(member.id)
            keyCrew.push({
                ...normalizeCrewMember(member),
                job: isWritingJob ? "Writer" : member.job,
                creditJob: member.job
            })
        })
    })

    return keyCrew.slice(0, 8)
}

const WRITING_JOBS = new Set([
    "Writer",
    "Screenplay",
    "Story",
    "Teleplay",
    "Screenstory",
    "Characters",
    "Novel",
    "Theatre Play",
    "Adaptation",
    "Dialogue",
    "Scenario",
    "Script",
    "Script Editor",
    "Author",
    "Comic Book"
])

const isProductionJob = (job = "") => {
    return job.includes("Producer")
        || job === "Production Manager"
        || job === "Production Supervisor"
        || job === "Casting"
}

const normalizeCreditBase = (raw = {}) => {
    const poster = getImage(raw.poster_path, "w342")

    return {
        id: raw.id,
        movieId: raw.id,
        title: raw.title || raw.original_title || "Untitled",
        originalTitle: raw.original_title || null,
        poster,
        posterUrl: poster?.url || null,
        releaseDate: raw.release_date || null,
        year: getYear(raw.release_date),
        rating: getRating(raw.vote_average),
        voteCount: raw.vote_count || 0,
        popularity: raw.popularity ?? null,
        type: "movie"
    }
}

const addFilmographyCredit = (map, raw, category, role, job) => {
    if (!raw?.id) return

    const existing = map.get(raw.id)

    if (existing) {
        if (role && !existing.roles.includes(role)) {
            existing.roles.push(role)
        }

        if (job && !existing.jobs.includes(job)) {
            existing.jobs.push(job)
        }

        if (!existing.releaseDate && raw.release_date) {
            existing.releaseDate = raw.release_date
            existing.year = getYear(raw.release_date)
        }

        return
    }

    map.set(raw.id, {
        ...normalizeCreditBase(raw),
        category,
        roles: role ? [role] : [],
        jobs: job ? [job] : []
    })
}

const sortFilmography = (credits) => {
    return credits.sort((a, b) => {
        if (a.releaseDate && b.releaseDate && a.releaseDate !== b.releaseDate) {
            return a.releaseDate < b.releaseDate ? 1 : -1
        }

        if (a.releaseDate && !b.releaseDate) return -1
        if (!a.releaseDate && b.releaseDate) return 1

        return (b.popularity || 0) - (a.popularity || 0)
    })
}

const finalizeFilmography = (map) => {
    return sortFilmography(
        Array.from(map.values()).map((credit) => ({
            ...credit,
            role: credit.roles.join(" / ") || credit.jobs.join(" / ") || "Cast",
            job: credit.jobs.join(" / ") || null,
            roles: undefined,
            jobs: undefined
        }))
    )
}

const buildFilmography = (rawCredits = {}) => {
    const acting = new Map()
    const directing = new Map()
    const writing = new Map()
    const production = new Map()

    ;(rawCredits.cast || []).forEach((credit) => {
        addFilmographyCredit(
            acting,
            credit,
            "acting",
            credit.character || "Cast",
            null
        )
    })

    ;(rawCredits.crew || []).forEach((credit) => {
        const job = credit.job || ""

        if (job === "Director") {
            addFilmographyCredit(directing, credit, "directing", job, job)
        }

        if (WRITING_JOBS.has(job)) {
            addFilmographyCredit(writing, credit, "writing", job, job)
        }

        if (isProductionJob(job)) {
            addFilmographyCredit(production, credit, "production", job, job)
        }
    })

    const actingCredits = finalizeFilmography(acting)
    const directingCredits = finalizeFilmography(directing)
    const writingCredits = finalizeFilmography(writing)
    const productionCredits = finalizeFilmography(production)

    const allById = new Map()

    ;[
        ...actingCredits,
        ...directingCredits,
        ...writingCredits,
        ...productionCredits
    ].forEach((credit) => {
        if (!allById.has(credit.id)) {
            allById.set(credit.id, credit)
        }
    })

    const knownFor = Array.from(allById.values())
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 6)

    return {
        acting: actingCredits,
        directing: directingCredits,
        writing: writingCredits,
        production: productionCredits,
        knownFor,
        counts: {
            acting: actingCredits.length,
            directing: directingCredits.length,
            writing: writingCredits.length,
            production: productionCredits.length,
            total: allById.size
        }
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
        profileUrl: member.profile_path
            ? `${TMDB_IMAGE_BASE}w185${member.profile_path}`
            : null,
        department: member.known_for_department || "Acting",
        order: member.order
    }))

    const crew = payload.credits?.crew || []
    const directorsDetailed = buildDirectors(crew)
    const directors = directorsDetailed.map((member) => member.name)
    const writersDetailed = []
    const seenWriters = new Set()

    crew.forEach((member) => {
        if (
            !member.id
            || seenWriters.has(member.id)
            || !["Screenplay", "Writer", "Story"].includes(member.job)
        ) {
            return
        }

        seenWriters.add(member.id)
        writersDetailed.push(normalizeCrewMember(member))
    })

    const writers = writersDetailed.map((member) => member.name)
    const directorIds = new Set(directorsDetailed.map((member) => member.id))
    const keyCrew = buildKeyCrew(crew, directorIds)

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
            directorsDetailed,
            director: directorsDetailed[0] || null,
            writers,
            writersDetailed,
            keyCrew
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

const GENDER_LABELS = {
    0: null,
    1: "Female",
    2: "Male",
    3: "Non-binary"
}

const safeHttpUrl = (value) => {
    if (!value) return null

    try {
        const url = new URL(String(value))

        return ["http:", "https:"].includes(url.protocol)
            ? url.toString()
            : null
    } catch {
        return null
    }
}

const normalizeExternalIds = (raw = {}) => {
    const imdbId = raw.imdb_id || null
    const wikidataId = raw.wikidata_id || null
    const facebookId = raw.facebook_id || null
    const instagramId = raw.instagram_id || null
    const twitterId = raw.twitter_id || null
    const tiktokId = raw.tiktok_id || null
    const youtubeId = raw.youtube_id || null

    const links = {}

    if (imdbId) {
        links.imdb = `https://www.imdb.com/name/${encodeURIComponent(imdbId)}`
    }

    if (wikidataId) {
        links.wikidata = `https://www.wikidata.org/wiki/${encodeURIComponent(wikidataId)}`
    }

    if (facebookId) {
        links.facebook = `https://www.facebook.com/${encodeURIComponent(facebookId)}`
    }

    if (instagramId) {
        links.instagram = `https://www.instagram.com/${encodeURIComponent(instagramId)}`
    }

    if (twitterId) {
        links.twitter = `https://twitter.com/${encodeURIComponent(twitterId)}`
    }

    if (tiktokId) {
        links.tiktok = `https://www.tiktok.com/@${encodeURIComponent(tiktokId)}`
    }

    if (youtubeId) {
        links.youtube = `https://www.youtube.com/channel/${encodeURIComponent(youtubeId)}`
    }

    return {
        imdbId,
        wikidataId,
        facebookId,
        instagramId,
        twitterId,
        tiktokId,
        youtubeId,
        links
    }
}

const personExternalIdCache = new Map()

const setPersonExternalIds = (personId, externalIds) => {
    if (personExternalIdCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = personExternalIdCache.keys().next().value
        if (oldestKey) personExternalIdCache.delete(oldestKey)
    }

    personExternalIdCache.set(Number(personId), {
        externalIds,
        expiresAt: Date.now() + DETAIL_TTL_MS
    })
}

const getPersonExternalIdsFromCache = (personId) => {
    const entry = personExternalIdCache.get(Number(personId))

    if (!entry) return null

    if (entry.expiresAt <= Date.now()) {
        personExternalIdCache.delete(Number(personId))
        return null
    }

    return entry.externalIds
}

const getPersonDetails = async (personId) => {
    let payload

    try {
        payload = await requestTmdb(
            `/person/${personId}`,
            {
                append_to_response: "movie_credits,external_ids"
            },
            DETAIL_TTL_MS
        )
    } catch (error) {
        if (error?.statusCode === 404) {
            throw new ApiError(404, "Person not found")
        }

        throw error
    }

    const externalIds = normalizeExternalIds(payload.external_ids || {})
    const filmography = buildFilmography(payload.movie_credits || {})
    const profile = getImage(payload.profile_path, "h632")

    setPersonExternalIds(personId, externalIds)

    return {
        id: payload.id,
        name: payload.name || "Unknown person",
        biography: payload.biography?.trim() || "",
        profile,
        profileUrl: profile?.url || null,
        birthday: payload.birthday || null,
        deathday: payload.deathday || null,
        placeOfBirth: payload.place_of_birth || null,
        gender: payload.gender ?? 0,
        genderLabel: GENDER_LABELS[payload.gender] || null,
        knownForDepartment: payload.known_for_department || null,
        alsoKnownAs: (payload.also_known_as || [])
            .filter(Boolean)
            .slice(0, 12),
        homepage: safeHttpUrl(payload.homepage),
        popularity: payload.popularity ?? null,
        adult: Boolean(payload.adult),
        externalIds,
        knownFor: filmography.knownFor,
        filmography: {
            acting: filmography.acting,
            directing: filmography.directing,
            writing: filmography.writing,
            production: filmography.production,
            counts: filmography.counts
        }
    }
}

const unavailableAwards = (reason) => ({
    available: false,
    source: "Wikidata",
    sourceUrl: null,
    items: [],
    awards: [],
    nominations: [],
    counts: {
        awards: 0,
        nominations: 0
    },
    reason
})

const getPersonAwards = async (personId) => {
    let externalIds = getPersonExternalIdsFromCache(personId)

    if (!externalIds) {
        try {
            const payload = await requestTmdb(
                `/person/${personId}/external_ids`,
                {},
                DETAIL_TTL_MS
            )

            externalIds = normalizeExternalIds(payload)
            setPersonExternalIds(personId, externalIds)
        } catch (error) {
            if (error?.statusCode === 404) {
                throw new ApiError(404, "Person not found")
            }

            throw error
        }
    }

    if (!externalIds.wikidataId) {
        return unavailableAwards(
            "This person has no linked Wikidata profile, so verified awards data is unavailable."
        )
    }

    return getAwardsForWikidataId(externalIds.wikidataId)
}

export {
    MOVIE_CATEGORIES,
    getGenres,
    resolveGenreId,
    getMoviesByCategory,
    searchMovies,
    searchMulti,
    discoverMoviesByGenre,
    getMovieDetails,
    getMovieSummary,
    getPersonDetails,
    getPersonAwards
}
