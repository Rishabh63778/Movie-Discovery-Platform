import { useNavigate } from "react-router-dom"
import "../styles/FilmographyCard.css"

function FilmographyCard({ credit }) {
    const navigate = useNavigate()

    const openMovie = () => {
        navigate(`/movie/${credit.id}`)
    }

    const handleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openMovie()
        }
    }

    return (
        <article
            className="Filmography-Card"
            onClick={openMovie}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`View ${credit.title} movie details`}
        >
            {
                credit.poster?.url ? (
                    <img
                        className="Filmography-Poster"
                        src={credit.poster.url}
                        alt={`${credit.title} poster`}
                        loading="lazy"
                    />
                ) : (
                    <div className="Filmography-Poster Filmography-Fallback">
                        {credit.title}
                    </div>
                )
            }

            <div className="Filmography-Info">
                <h3>{credit.title}</h3>

                <div className="Filmography-Meta">
                    <span>{credit.year || "Year TBA"}</span>

                    {
                        credit.rating > 0 && (
                            <>
                                <span className="Dot">•</span>
                                <span>⭐ {credit.rating}</span>
                            </>
                        )
                    }
                </div>

                {
                    credit.role && (
                        <p className="Filmography-Role" title={credit.role}>
                            {credit.role}
                        </p>
                    )
                }
            </div>
        </article>
    )
}

export default FilmographyCard
