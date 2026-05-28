import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {useRef} from "react"
import api from "../api/axios.js"
import "../styles/WatchHistory.css"

function WatchHistory() {

    const navigate = useNavigate()

    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchHistory = async () => {

        try {

            const res = await api.get("/watch-history")
            

            setHistory(res.data.data)

        } catch (error) {

            console.log(error)

        } finally {

            setLoading(false)
        }
    }

    useEffect(() => {

        fetchHistory()

    }, [])

    if (loading) {

        return <p>Loading...</p>
    }

    return (

        <div className="WatchHistory">

            <h1>Watch History</h1>

            <div className="History-Grid">

                {
                    history.length > 0 ? (

                        history.map((movie) => (

                            <div
                                className="History-Card"
                                key={movie.movieDetails._id}
                                onClick={() =>
                                    navigate(`/movie/${movie.movieDetails._id}`,{
                                        state:{
                                            ...movie.movieDetails,
                                            progress:movie.progress
                                        }
                                    })
                                }
                            >

                                <img
                                    src={movie.movieDetails.poster?.url}
                                    alt={movie.movieDetails.title}
                                />

                                <div>

                                    <h3>{movie.movieDetails.title}</h3>

                                </div>

                            </div>
                        ))

                    ) : (

                        <p>No Watch History Found</p>
                    )
                }

            </div>

        </div>
    )
}

export default WatchHistory