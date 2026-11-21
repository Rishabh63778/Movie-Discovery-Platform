import "../styles/TvCard.css"

function TvCard({ show }) {
    const tmdbUrl = `https://www.themoviedb.org/tv/${show.id}`

    return (
        <article className="Tv-Card">
            {
                show.poster?.url ? (
                    <img
                        className="Tv-Card-Poster"
                        src={show.poster.url}
                        alt={`${show.title} poster`}
                        loading="lazy"
                    />
                ) : (
                    <div className="Tv-Card-Poster Tv-Card-Fallback">
                        {show.title}
                    </div>
                )
            }

            <div className="Tv-Card-Info">
                <span className="Tv-Card-Badge">TV Series</span>

                <h3>{show.title}</h3>

                <div className="Tv-Card-Meta">
                    <span>⭐ {show.rating || "N/A"}</span>

                    {
                        show.year && (
                            <>
                                <span className="Dot">•</span>
                                <span>{show.year}</span>
                            </>
                        )
                    }
                </div>

                {
                    show.genre?.length > 0 && (
                        <p className="Tv-Card-Genres">
                            {show.genre.slice(0, 2).join(" • ")}
                        </p>
                    )
                }

                <a
                    className="Tv-Card-Link"
                    href={tmdbUrl}
                    target="_blank"
                    rel="noreferrer"
                >
                    View on TMDB ↗
                </a>
            </div>
        </article>
    )
}

export default TvCard
