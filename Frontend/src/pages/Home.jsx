import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios.js"
import MovieCard from "../components/MovieCard.jsx"
import Navbar from "../components/Navbar.jsx"
import PersonCard from "../components/PersonCard.jsx"
import TvCard from "../components/TvCard.jsx"
import "../styles/Home.css"

const HOME_SECTIONS = [
    {
        key: "trending",
        title: "Trending Movies",
        params: { category: "trending" }
    },
    {
        key: "popular",
        title: "Popular Movies",
        params: { category: "popular" }
    },
    {
        key: "top_rated",
        title: "Top Rated Movies",
        params: { category: "top_rated" }
    },
    {
        key: "action",
        title: "Action Movies",
        params: { genre: "Action" }
    }
]

function Home() {
    const navigate = useNavigate()

    const [rows, setRows] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [searchInput, setSearchInput] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState(null)
    const [searching, setSearching] = useState(false)
    const [searchError, setSearchError] = useState("")
    const searchRequestRef = useRef(0)
    const searchAbortRef = useRef(null)
    const searchDebounceRef = useRef(null)

    useEffect(() => {
        let cancelled = false

        const fetchhome = async () => {
            setLoading(true)
            setError("")

            const responses = await Promise.allSettled(
                HOME_SECTIONS.map((section) => (
                    api.get("/movies", { params: section.params })
                ))
            )

            if (cancelled) return

            const nextRows = {}
            let successfulRequests = 0

            responses.forEach((response, index) => {
                if (response.status === "fulfilled") {
                    successfulRequests += 1
                    nextRows[HOME_SECTIONS[index].key] = response.value.data.data.results
                }
            })

            setRows(nextRows)

            if (successfulRequests === 0) {
                setError("Unable to load movies right now. Please try again.")
            }

            setLoading(false)
        }

        fetchhome()

        return () => {
            cancelled = true
        }
    }, [])

    const performSearch = useCallback(async (rawQuery) => {
        const query = rawQuery.trim()

        if (!query) return

        if (searchAbortRef.current) {
            searchAbortRef.current.abort()
        }

        const controller = new AbortController()
        searchAbortRef.current = controller

        const requestId = searchRequestRef.current + 1
        searchRequestRef.current = requestId

        setSearching(true)
        setSearchError("")
        setSearchQuery(query)
        setSearchResults(null)

        try {
            const response = await api.get("/search/multi", {
                params: { query },
                signal: controller.signal
            })

            if (requestId !== searchRequestRef.current) return

            setSearchResults(response.data.data)
        } catch (err) {
            if (requestId !== searchRequestRef.current) return

            if (err.code === "ERR_CANCELED" || err.name === "CanceledError") {
                return
            }

            setSearchResults({
                movies: [],
                tv: [],
                people: [],
                counts: { movies: 0, tv: 0, people: 0, total: 0 }
            })
            setSearchError(
                err.response?.data?.message
                || "Unable to search movies, TV shows and people right now."
            )
        } finally {
            if (requestId === searchRequestRef.current) {
                setSearching(false)
            }
        }
    }, [])

    useEffect(() => () => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current)
        }

        searchAbortRef.current?.abort()
    }, [])

    const handleSearchInputChange = (event) => {
        const value = event.target.value
        const query = value.trim()

        setSearchInput(value)

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current)
        }

        searchAbortRef.current?.abort()
        searchRequestRef.current += 1

        if (query.length < 2) {
            setSearchQuery("")
            setSearchResults(null)
            setSearchError("")
            setSearching(false)
            return
        }

        if (query === searchQuery && searchResults && !searchError) {
            return
        }

        setSearchQuery(query)
        setSearchResults(null)
        setSearchError("")
        setSearching(true)

        searchDebounceRef.current = setTimeout(() => {
            performSearch(query)
        }, 350)
    }

    const handlesearch = (event) => {
        event.preventDefault()

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current)
        }

        const query = searchInput.trim()

        if (!query) {
            clearsearch()
            return
        }

        if (query === searchQuery && searchResults && !searchError) {
            return
        }

        performSearch(query)
    }

    const clearsearch = () => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current)
        }

        searchAbortRef.current?.abort()
        searchRequestRef.current += 1

        setSearchInput("")
        setSearchQuery("")
        setSearchResults(null)
        setSearchError("")
        setSearching(false)
    }

    const featured = rows.trending?.[0]

    const heroStyle = featured?.backdrop?.url
        ? {
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.4)), url("${featured.backdrop.url}")`
        }
        : undefined

    const searchCounts = searchResults?.counts || {
        movies: 0,
        tv: 0,
        people: 0,
        total: 0
    }

    return (
        <div className="Home">

            <Navbar />

            <div className="Hero" style={heroStyle}>

                <div className="Hero-Content">

                    <h1>
                        Discover Movies You'll Love
                    </h1>

                    <p>
                        Browse movies, discover TV shows and explore the people behind them.
                    </p>

                    <form className="Search-Bar" onSubmit={handlesearch}>

                        <input
                            type="text"
                            placeholder="Search movies, TV shows, actors or directors..."
                            value={searchInput}
                            onChange={handleSearchInputChange}
                            aria-label="Search movies, TV shows, actors and directors"
                        />

                        <button type="submit">
                            Search
                        </button>

                        {
                            searchInput && (
                                <button
                                    type="button"
                                    className="Clear-Search"
                                    onClick={clearsearch}
                                >
                                    Clear
                                </button>
                            )
                        }

                    </form>

                    {
                        featured && (
                            <button
                                type="button"
                                className="Hero-Featured"
                                onClick={() => navigate(`/movie/${featured.id}`)}
                            >
                                <span>Featured today</span>
                                {featured.title}
                                <span aria-hidden="true">→</span>
                            </button>
                        )
                    }

                </div>

            </div>

            {
                searchQuery ? (
                    <section className="Movies-Section Search-Results">

                        <h2>
                            Search Results for "{searchQuery}"
                        </h2>

                        {
                            searching ? (
                                <div
                                    className="Search-Skeleton"
                                    role="status"
                                    aria-label="Searching movies, TV shows and people"
                                >
                                    <p className="Search-Status">
                                        Searching movies, TV shows and people...
                                    </p>

                                    <div className="Search-Skeleton-Grid" aria-hidden="true">
                                        {
                                            Array.from({ length: 8 }).map((_, index) => (
                                                <div className="Search-Skeleton-Card" key={index}>
                                                    <div className="Skeleton-Block Search-Skeleton-Poster" />

                                                    <div className="Search-Skeleton-Info">
                                                        <div className="Skeleton-Block Search-Skeleton-Line" />
                                                        <div className="Skeleton-Block Search-Skeleton-Line Search-Skeleton-Line--Short" />
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            ) : searchError ? (
                                <div className="Search-Error">
                                    <p className="Error">{searchError}</p>

                                    <button
                                        type="button"
                                        className="Search-Retry"
                                        onClick={() => performSearch(searchQuery)}
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : searchResults ? (
                                searchCounts.total > 0 ? (
                                    <>
                                        <p className="Results-Count">
                                            Showing {searchCounts.total} results across
                                            movies, TV shows and people
                                        </p>

                                        {
                                            searchCounts.movies > 0 && (
                                                <div className="Search-Category">
                                                    <div className="Search-Category-Header">
                                                        <h3>Movies</h3>
                                                        <span>{searchCounts.movies}</span>
                                                    </div>

                                                    <div className="Movie-Grid">
                                                        {
                                                            searchResults.movies.map((movie) => (
                                                                <MovieCard
                                                                    key={movie.id}
                                                                    movie={movie}
                                                                />
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        }

                                        {
                                            searchCounts.tv > 0 && (
                                                <div className="Search-Category">
                                                    <div className="Search-Category-Header">
                                                        <h3>TV Shows</h3>
                                                        <span>{searchCounts.tv}</span>
                                                    </div>

                                                    <div className="Movie-Grid">
                                                        {
                                                            searchResults.tv.map((show) => (
                                                                <TvCard
                                                                    key={show.id}
                                                                    show={show}
                                                                />
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        }

                                        {
                                            searchCounts.people > 0 && (
                                                <div className="Search-Category">
                                                    <div className="Search-Category-Header">
                                                        <h3>People</h3>
                                                        <span>{searchCounts.people}</span>
                                                    </div>

                                                    <div className="Movie-Grid">
                                                        {
                                                            searchResults.people.map((person) => (
                                                                <PersonCard
                                                                    key={person.id}
                                                                    person={person}
                                                                />
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </>
                                ) : (
                                    <p className="No-Movies">
                                        No movies, TV shows or people found for
                                        "{searchQuery}"
                                    </p>
                                )
                            ) : (
                                <p className="Loading">Searching...</p>
                            )
                        }

                    </section>
                ) : loading ? (
                    <section className="Movies-Section">
                        <p className="Loading">Loading movies...</p>
                    </section>
                ) : error ? (
                    <section className="Movies-Section">
                        <p className="Error">{error}</p>
                    </section>
                ) : (
                    HOME_SECTIONS.map((section) => (
                        <section className="Movies-Section" key={section.key}>
                            <h2>{section.title}</h2>

                            {
                                rows[section.key]?.length > 0 ? (
                                    <div className="Movie-Grid">
                                        {
                                            rows[section.key].map((movie) => (
                                                <MovieCard key={movie.id} movie={movie} />
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <p className="No-Movies">No movies available</p>
                                )
                            }
                        </section>
                    ))
                )
            }

            <footer className="Tmdb-Attribution">
                Movie data provided by{" "}
                <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
                    TMDB
                </a>
                . This product uses the TMDB API but is not endorsed or certified by TMDB.
            </footer>

        </div>
    )
}

export default Home
