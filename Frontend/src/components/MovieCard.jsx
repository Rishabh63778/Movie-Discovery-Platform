import { useNavigate } from "react-router-dom"
import "../styles/MovieCard.css"

function MovieCard({ movie }) {
    const navigate = useNavigate()

    const openMovie = () => {
        navigate(`/movie/${movie.id}`)
    }

    const handleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openMovie()
        }
    }

    return (
        <article
            className="Movie-Card"
            onClick={openMovie}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${movie.title}`}
        >
            {
                movie.poster?.url ? (
                    <img
                        className="Movie-Card-Poster"
                        src={movie.poster.url}
                        alt={`${movie.title} poster`}
                        loading="lazy"
                    />
                ) : (
                    <div className="Movie-Card-Fallback">
                        <span>{movie.title}</span>
                    </div>
                )
            }

            <div className="Movie-Info">
                <h3>{movie.title}</h3>

                <div className="Movie-Card-Meta">
                    <span>⭐ {movie.rating || "N/A"}</span>
                    {
                        movie.year && (
                            <>
                                <span className="Dot">•</span>
                                <span>{movie.year}</span>
                            </>
                        )
                    }
                </div>

                {
                    movie.genre?.length > 0 && (
                        <p className="Movie-Card-Genres">
                            {movie.genre.slice(0, 2).join(" • ")}
                        </p>
                    )
                }
            </div>
        </article>
    )
}

export default MovieCard
