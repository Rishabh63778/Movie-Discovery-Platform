import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api/axios.js"
import MovieCard from "../components/MovieCard.jsx"
import getInitials from "../utils/initials.js"
import "../styles/MovieDisplay.css"

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

    const openPerson = (personId) => {
        if (!personId) return

        navigate(`/person/${personId}`)
    }

    const handlePersonKeyDown = (event, personId) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openPerson(personId)
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

    const directors = movie.crew?.directorsDetailed?.length > 0
        ? movie.crew.directorsDetailed
        : (movie.crew?.directors || []).map((name) => ({
            id: null,
            name,
            profile: null
        }))

    const keyCrew = movie.crew?.keyCrew || []

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
                directors.length > 0 && (
                    <section className="MovieDisplay-Section">
                        <h2>
                            Director{directors.length > 1 ? "s" : ""}
                        </h2>

                        <div className="Director-List">
                            {
                                directors.map((director, index) => {
                                    const clickable = Boolean(director.id)

                                    return (
                                        <article
                                            className={
                                                clickable
                                                    ? "Director-Card Director-Card--Clickable"
                                                    : "Director-Card"
                                            }
                                            key={director.id || `${director.name}-${index}`}
                                            onClick={
                                                clickable
                                                    ? () => openPerson(director.id)
                                                    : undefined
                                            }
                                            onKeyDown={
                                                clickable
                                                    ? (event) => handlePersonKeyDown(event, director.id)
                                                    : undefined
                                            }
                                            role={clickable ? "button" : undefined}
                                            tabIndex={clickable ? 0 : undefined}
                                            aria-label={
                                                clickable
                                                    ? `View ${director.name} profile`
                                                    : undefined
                                            }
                                        >
                                            <div className="Director-Photo">
                                                {
                                                    director.profile?.url ? (
                                                        <img
                                                            src={director.profile.url}
                                                            alt={director.name}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="Director-Fallback">
                                                            {getInitials(director.name)}
                                                        </div>
                                                    )
                                                }
                                            </div>

                                            <div className="Director-Info">
                                                <span className="Crew-Role">
                                                    Director
                                                </span>
                                                <h3>{director.name}</h3>
                                            </div>

                                            {
                                                clickable && (
                                                    <span className="Crew-Arrow" aria-hidden="true">
                                                        →
                                                    </span>
                                                )
                                            }
                                        </article>
                                    )
                                })
                            }
                        </div>
                    </section>
                )
            }

            {
                keyCrew.length > 0 && (
                    <section className="MovieDisplay-Section">
                        <h2>Key Crew</h2>

                        <div className="Key-Crew-List">
                            {
                                keyCrew.map((member) => {
                                    const clickable = Boolean(member.id)

                                    return (
                                        <article
                                            className={
                                                clickable
                                                    ? "Key-Crew-Card Key-Crew-Card--Clickable"
                                                    : "Key-Crew-Card"
                                            }
                                            key={member.id}
                                            onClick={
                                                clickable
                                                    ? () => openPerson(member.id)
                                                    : undefined
                                            }
                                            onKeyDown={
                                                clickable
                                                    ? (event) => handlePersonKeyDown(event, member.id)
                                                    : undefined
                                            }
                                            role={clickable ? "button" : undefined}
                                            tabIndex={clickable ? 0 : undefined}
                                            aria-label={
                                                clickable
                                                    ? `View ${member.name} profile`
                                                    : undefined
                                            }
                                        >
                                            <div className="Key-Crew-Photo">
                                                {
                                                    member.profile?.url ? (
                                                        <img
                                                            src={member.profile.url}
                                                            alt={member.name}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="Key-Crew-Fallback">
                                                            {getInitials(member.name)}
                                                        </div>
                                                    )
                                                }
                                            </div>

                                            <div className="Key-Crew-Info">
                                                <span className="Crew-Role">
                                                    {member.job || member.department || "Crew"}
                                                </span>
                                                <h3>{member.name}</h3>
                                            </div>
                                        </article>
                                    )
                                })
                            }
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
                                    <article
                                        className="Cast-Card Cast-Card--Clickable"
                                        key={`${member.id}-${member.order}`}
                                        onClick={() => openPerson(member.id)}
                                        onKeyDown={(event) => handlePersonKeyDown(event, member.id)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View ${member.actor} profile`}
                                    >
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
                                    </article>
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
