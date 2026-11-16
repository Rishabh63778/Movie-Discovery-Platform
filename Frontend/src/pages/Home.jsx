import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api/axios.js"
import MovieCard from "../components/MovieCard.jsx"
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
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [searchError, setSearchError] = useState("")
    const searchRequestRef = useRef(0)

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

    const handlesearch = async (event) => {
        event.preventDefault()

        const query = searchInput.trim()

        if (!query) {
            clearsearch()
            return
        }

        const requestId = searchRequestRef.current + 1
        searchRequestRef.current = requestId

        setSearching(true)
        setSearchError("")

        try {
            const response = await api.get("/movies/search", {
                params: { query }
            })

            if (requestId !== searchRequestRef.current) return

            setSearchResults(response.data.data.results)
            setSearchQuery(query)
        } catch (err) {
            if (requestId !== searchRequestRef.current) return

            setSearchResults([])
            setSearchQuery(query)
            setSearchError(
                err.response?.data?.message || "Unable to search movies right now."
            )
        } finally {
            if (requestId === searchRequestRef.current) {
                setSearching(false)
            }
        }
    }

    const clearsearch = () => {
        searchRequestRef.current += 1
        setSearchInput("")
        setSearchQuery("")
        setSearchResults([])
        setSearchError("")
        setSearching(false)
    }

    const featured = rows.trending?.[0]

    const heroStyle = featured?.backdrop?.url
        ? {
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.4)), url("${featured.backdrop.url}")`
        }
        : undefined

    return (
        <div className="Home">

            <header className="Top-Bar">
                <Link to="/home" className="Brand">
                    CineScope
                </Link>

                <nav className="Top-Bar-Links">
                    <Link to="/favourites">Favourites</Link>
                </nav>
            </header>

            <div className="Hero" style={heroStyle}>

                <div className="Hero-Content">

                    <h1>
                        Discover Movies You'll Love
                    </h1>

                    <p>
                        Browse, search and explore your favorite movies.
                    </p>

                    <form className="Search-Bar" onSubmit={handlesearch}>

                        <input
                            type="text"
                            placeholder="Search movies..."
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            aria-label="Search movies"
                        />

                        <button type="submit">
                            Search
                        </button>

                        {
                            searchQuery && (
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
                    <section className="Movies-Section">

                        <h2>
                            Search Results for "{searchQuery}"
                        </h2>

                        {
                            searching ? (
                                <p className="Loading">Searching movies...</p>
                            ) : searchError ? (
                                <p className="Error">{searchError}</p>
                            ) : searchResults.length > 0 ? (
                                <>
                                    <p className="Results-Count">
                                        Showing {searchResults.length} results
                                    </p>

                                    <div className="Movie-Grid">
                                        {
                                            searchResults.map((movie) => (
                                                <MovieCard key={movie.id} movie={movie} />
                                            ))
                                        }
                                    </div>
                                </>
                            ) : (
                                <p className="No-Movies">
                                    No movies found for "{searchQuery}"
                                </p>
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
