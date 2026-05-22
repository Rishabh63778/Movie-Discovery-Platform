import { useLocation, useNavigate } from "react-router-dom"
import "../styles/Player.css"

function Player() {
    const location = useLocation()
    const navigate = useNavigate()

    const movie = location.state

    if (!movie) {
        return (
            <div className="Player-Error">
                <h1>Movie not found</h1>
                <button onClick={() => navigate("/home")}>
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <div className="Player">
            <div className="Player-Container">

                <video
                    className="Video-Player"
                    controls
                    autoPlay
                    poster={movie.poster}
                >
                    <source src={movie.video?.url} type="video/mp4" />
                    Your browser does not support video playback.
                </video>

                <div className="Movie-Info">
                    <h1>{movie.title}</h1>

                    <div className="Movie-Details">
                        <span>{movie.year}</span>
                        <span>{movie.genre}</span>
                    </div>

                    <p>{movie.description}</p>

                    <button
                        className="Back-Btn"
                        onClick={() => navigate("/home")}
                    >
                        Back to Home
                    </button>
                </div>

            </div>
        </div>
    )
}

export default Player