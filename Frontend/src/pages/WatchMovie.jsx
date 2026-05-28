import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/axios.js"
import "../styles/WatchMovie.css"
import { useRef } from "react"

function WatchMovie() {
    const videoRef = useRef(null)

    const { id } = useParams()
    const navigate = useNavigate()

    const [movie, setmovie] = useState(null)
    const [loading, setloading] = useState(true)
    const [progress, setProgress] = useState(0)

    useEffect(() => {

        const fetchmovie = async () => {

            try {

                const response =
                    await api.get(`/movies/${id}`)

                setmovie(response.data.data)

                const historyResponse =
                    await api.get("/watch-history")

                const historyMovie =
                    historyResponse.data.data.find(
                        (item) =>
                            item.movieDetails._id === id
                    )

                if (historyMovie) {

                    setProgress(historyMovie.progress)
                }

            } catch (error) {

                console.log(error)

            } finally {

                setloading(false)
            }
        }

        fetchmovie()

    }, [id])

    const saveWatchHistory = async () => {

        try {

            await api.patch("/watch-history", {
                movieId: movie._id,
                progress: videoRef.current.currentTime
            })

        } catch (error) {

            console.log(error)
        }
    }

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
                    ref={videoRef}
                    controls
                    autoPlay
                    width="100%"
                    poster={movie.poster?.url}
                    onPause={saveWatchHistory}
                    onEnded={saveWatchHistory}
                    onLoadedMetadata={() => {

                        if (progress > 0) {

                            videoRef.current.currentTime =
                                progress
                        }
                    }}
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