import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api/axios.js"
import MovieCard from "../components/MovieCard.jsx"
import "../styles/MovieDisplay.css"

const getInitials = (name = "") => {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
}

function MovieDisplay() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [movie, setMovie] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isFavourite, setIsFavourite] = useState(false)
    const [favouriteLoading, setFavouriteLoading] = useState(false)
    const [favouriteError, setFavouriteError] = useState("")

    useEffect(() => {
        let cancelled = false

        const fetchmovie = async () => {
            setLoading(true)
            setError("")
            setMovie(null)
            setIsFavourite(false)
            setIsAuthenticated(false)
            setFavouriteError("")
            setFavouriteLoading(false)

            window.scrollTo(0, 0)

            try {
                const response = await api.get(`/movies/${id}`)

                if (cancelled) return

                setMovie(response.data.data)
            } catch (err) {
                if (cancelled) return

                setError(
                    err.response?.status === 404
                        ? "Movie not found"
                        : err.response?.data?.message || "Unable to load this movie right now."
                )
            } finally {
                if (!cancelled) setLoading(false)
            }

            try {
                await api.get("/users/currentuser")

                if (cancelled) return

                setIsAuthenticated(true)

                const favouriteResponse = await api.get(`/favourites/${id}`)

                if (!cancelled) {
                    setIsFavourite(Boolean(favouriteResponse.data.data.isFavourite))
                }
            } catch {
                // Guests can still browse; favourite actions will ask them to log in.
            }
        }

        fetchmovie()

        return () => {
            cancelled = true
        }
    }, [id])

    const relatedMovies = useMemo(() => {
        if (!movie) return []

        const seen = new Set()
        const combined = [
            ...(movie.similar || []),
            ...(movie.recommendations || [])
        ]

        return combined.filter((item) => {
            if (!item?.id || seen.has(item.id) || item.id === movie.id) {
                return false
            }

            seen.add(item.id)
            return true
        }).slice(0, 12)
    }, [movie])

    const togglefavourite = async () => {
        if (!isAuthenticated) {
            navigate("/login")
            return
        }

        setFavouriteLoading(true)
        setFavouriteError("")

        try {
            if (isFavourite) {
                await api.delete(`/favourites/${Number(id)}`)
                setIsFavourite(false)
            } else {
                await api.post("/favourites", { movieId: Number(id) })
                setIsFavourite(true)
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setIsAuthenticated(false)
            }

            setFavouriteError(
                err.response?.data?.message || "Unable to update favourites right now."
            )
        } finally {
            setFavouriteLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="MovieDisplay">
                <div className="MovieDisplay-State">
                    <h1>Loading...</h1>
                </div>
            </div>
        )
    }

    if (error || !movie) {
        return (
            <div className="MovieDisplay">
                <div className="MovieDisplay-State">
                    <h1>{error || "Movie not found"}</h1>

                    <button
                        className="BackButton"
                        onClick={() => navigate("/home")}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    const heroStyle = movie.backdrop?.url
        ? {
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.45), #111 92%), url("${movie.backdrop.url}")`
        }
        : undefined

    return (
        <div className="MovieDisplay">

            <div className="MovieDisplay-Hero" style={heroStyle}>
                <div className="MovieDisplay-Container">

                    <div className="MovieDisplay-Poster">
                        {
                            movie.poster?.url ? (
                                <img
                                    src={movie.poster.url}
                                    alt={`${movie.title} poster`}
                                />
                            ) : (
                                <div className="MovieDisplay-Poster-Fallback">
                                    {movie.title}
                                </div>
                            )
                        }
                    </div>

                    <div className="MovieDisplay-Info">

                        <h1>{movie.title}</h1>

                        {
                            movie.tagline && (
                                <p className="Tagline">"{movie.tagline}"</p>
                            )
                        }

                        <div className="Movie-Meta-Row">
                            <span>⭐ {movie.rating || "N/A"}</span>
                            {
                                movie.year && (
                                    <>
                                        <span className="Dot">•</span>
                                        <span>{movie.year}</span>
                                    </>
                                )
                            }
                            {
                                movie.duration && (
                                    <>
                                        <span className="Dot">•</span>
                                        <span>{movie.duration} min</span>
                                    </>
                                )
                            }
                            {
                                movie.status && (
                                    <>
                                        <span className="Dot">•</span>
                                        <span>{movie.status}</span>
                                    </>
                                )
                            }
                        </div>

                        <p className="Description">
                            {movie.description}
                        </p>

                        {
                            movie.genres?.length > 0 && (
                                <div className="Genre-List">
                                    {
                                        movie.genres.map((genre) => (
                                            <span className="Genre-Chip" key={genre.id}>
                                                {genre.name}
                                            </span>
                                        ))
                                    }
                                </div>
                            )
                        }

                        <div className="MovieDetails">

                            <p>
                                <span>Release date:</span> {movie.releaseDate || "N/A"}
                            </p>

                            {
                                movie.crew?.directors?.length > 0 && (
                                    <p>
                                        <span>Director:</span> {movie.crew.directors.join(", ")}
                                    </p>
                                )
                            }

                            {
                                movie.crew?.writers?.length > 0 && (
                                    <p>
                                        <span>Writers:</span> {movie.crew.writers.slice(0, 3).join(", ")}
                                    </p>
                                )
                            }

                            {
                                movie.spokenLanguages?.length > 0 && (
                                    <p>
                                        <span>Languages:</span> {movie.spokenLanguages.join(", ")}
                                    </p>
                                )
                            }

                        </div>

                        <div className="MovieDisplay-Buttons">

                            <button
                                className="BackButton"
                                onClick={() => navigate("/home")}
                            >
                                Back
                            </button>

                            <button
                                className={`FavouriteButton ${isFavourite ? "Active" : ""}`}
                                onClick={togglefavourite}
                                disabled={favouriteLoading}
                            >
                                {
                                    favouriteLoading
                                        ? "Saving..."
                                        : !isAuthenticated
                                            ? "Log in to save"
                                            : isFavourite
                                                ? "♥ Remove from Favourites"
                                                : "♡ Add to Favourites"
                                }
                            </button>

                        </div>

                        {
                            favouriteError && (
                                <p className="Favourite-Error">{favouriteError}</p>
                            )
                        }

                    </div>

                </div>
            </div>

            {
                movie.trailer?.key && (
                    <section className="MovieDisplay-Section">
                        <h2>Official Trailer</h2>

                        <div className="Trailer-Wrapper">
                            <iframe
                                src={`https://www.youtube.com/embed/${movie.trailer.key}`}
                                title={`${movie.title} trailer`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </section>
                )
            }

            {
                movie.cast?.length > 0 && (
                    <section className="MovieDisplay-Section">
                        <h2>Top Cast</h2>

                        <div className="Cast-List">
                            {
                                movie.cast.slice(0, 12).map((member) => (
                                    <div className="Cast-Card" key={member.id}>
                                        {
                                            member.profile?.url ? (
                                                <img
                                                    src={member.profile.url}
                                                    alt={member.actor}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="Cast-Fallback">
                                                    {getInitials(member.actor)}
                                                </div>
                                            )
                                        }

                                        <h3>{member.actor}</h3>
                                        <p>{member.character || "Cast"}</p>
                                    </div>
                                ))
                            }
                        </div>
                    </section>
                )
            }

            {
                relatedMovies.length > 0 && (
                    <section className="MovieDisplay-Section">
                        <h2>More Like This</h2>

                        <div className="Movie-Grid">
                            {
                                relatedMovies.map((relatedMovie) => (
                                    <MovieCard
                                        key={relatedMovie.id}
                                        movie={relatedMovie}
                                    />
                                ))
                            }
                        </div>
                    </section>
                )
            }

        </div>
    )
}

export default MovieDisplay
