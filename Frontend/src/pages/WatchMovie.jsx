import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/axios.js"
import "../styles/WatchMovie.css"

function WatchMovie() {

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
            <div className="WatchMovie">
                <h1>Loading...</h1>
            </div>
        )
    }

    if (!movie) {
        return (
            <div className="WatchMovie">
                <h1>Movie not found</h1>
            </div>
        )
    }

    return (
        <div className="WatchMovie">

            <div className="VideoContainer">

                <video
                    controls
                    autoPlay
                    width="100%"
                    poster={movie.poster?.url}
                >
                    <source
                        src={movie.video?.url}
                        type="video/mp4"
                    />

                    Your browser does not support video playback.

                </video>

            </div>

            <div className="MovieInfo">

                <h1>{movie.title}</h1>

                <p>{movie.description}</p>

                <button onClick={() => navigate(-1)}>
                    Back
                </button>

            </div>

        </div>
    )
}

export default WatchMovie