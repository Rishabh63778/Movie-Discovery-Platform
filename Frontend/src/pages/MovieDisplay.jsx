import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/axios.js"
import "../styles/MovieDisplay.css"

function MovieDisplay() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [movie, setmovie] = useState(null)
    const [loading, setloading] = useState(true)

    useEffect(() => {
        const fetchmovie = async () => {
            try {
                const response = await api.get(`/movies/${id}`)
                setmovie(response.data.data)
            } catch (error) {
                console.log(error)
            } finally {
                setloading(false)
            }
        }

        fetchmovie()
    }, [id])

    if (loading) {
        return (
            <div className="MovieDisplay">
                <h1>Loading...</h1>
            </div>
        )
    }

    if (!movie) {
        return (
            <div className="MovieDisplay">
                <h1>Movie not found</h1>

                <button onClick={() => navigate("/home")}>
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <div className="MovieDisplay">
            <div className="MovieDisplay-Container">

                <div className="MovieDisplay-Poster">
                    <img
                        src={movie.poster?.url}
                        alt={movie.title}
                    />
                </div>

                <div className="MovieDisplay-Info">

                    <h1>{movie.title}</h1>

                    <p className="Description">
                        {movie.description}
                    </p>

                    <div className="MovieDetails">

                        <p>
                            <span>Genre:</span> {movie.genre}
                        </p>

                        <p>
                            <span>Release Year:</span> {movie.year}
                        </p>

                        <p>
                            <span>Duration:</span> {movie.duration} mins
                        </p>

                        <p>
                            <span>Rating:</span> ⭐ {movie.rating}
                        </p>

                    </div>

                    <div className="MovieDisplay-Buttons">

                        <button
                            className="WatchButton"
                            onClick={() => navigate(`/watch/${movie._id}`)}
                        >
                            Watch Now
                        </button>

                        <button
                            className="BackButton"
                            onClick={() => navigate("/home")}
                        >
                            Back
                        </button>

                    </div>

                </div>

            </div>
        </div>
    )
}

export default MovieDisplay