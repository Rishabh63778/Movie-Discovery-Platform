import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../api/axios.js"
import MovieCard from "../components/MovieCard.jsx"
import "../styles/Favourites.css"

function Favourites() {
    const [favourites, setFavourites] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [unauthorized, setUnauthorized] = useState(false)
    const [removingId, setRemovingId] = useState(null)

    useEffect(() => {
        let cancelled = false

        const fetchfavourites = async () => {
            try {
                const response = await api.get("/favourites")

                if (!cancelled) {
                    setFavourites(response.data.data)
                }
            } catch (err) {
                if (cancelled) return

                if (err.response?.status === 401) {
                    setUnauthorized(true)
                } else {
                    setError(
                        err.response?.data?.message || "Unable to load favourites right now."
                    )
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchfavourites()

        return () => {
            cancelled = true
        }
    }, [])

    const removefavourite = async (movieId) => {
        setRemovingId(movieId)
        setError("")

        try {
            await api.delete(`/favourites/${movieId}`)
            setFavourites((current) => (
                current.filter((movie) => movie.id !== movieId)
            ))
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to remove this favourite right now."
            )
        } finally {
            setRemovingId(null)
        }
    }

    return (
        <div className="Favourites">

            <header className="Favourites-Header">
                <Link to="/home" className="Back-Link">← Back to Home</Link>
                <h1>My Favourites</h1>
                <p>Movies you have saved to your account.</p>
            </header>

            {
                loading ? (
                    <p className="Loading">Loading favourites...</p>
                ) : unauthorized ? (
                    <div className="Favourites-Empty">
                        <h2>Please log in</h2>
                        <p>You need an account to view and save favourite movies.</p>
                        <Link to="/login">Go to Login</Link>
                    </div>
                ) : favourites.length === 0 ? (
                    error ? (
                        <p className="Error">{error}</p>
                    ) : (
                        <div className="Favourites-Empty">
                            <h2>No favourites yet</h2>
                            <p>Open a movie and choose “Add to Favourites” to build your list.</p>
                            <Link to="/home">Browse Movies</Link>
                        </div>
                    )
                ) : (
                    <>
                        {
                            error && <p className="Error">{error}</p>
                        }

                        <div className="Movie-Grid">
                            {
                                favourites.map((movie) => (
                                    <div className="Favourite-Item" key={movie.id}>
                                        <MovieCard movie={movie} />

                                        <button
                                            type="button"
                                            className="Remove-Favourite"
                                            onClick={() => removefavourite(movie.id)}
                                            disabled={removingId === movie.id}
                                        >
                                            {
                                                removingId === movie.id
                                                    ? "Removing..."
                                                    : "Remove"
                                            }
                                        </button>
                                    </div>
                                ))
                            }
                        </div>
                    </>
                )
            }

        </div>
    )
}

export default Favourites
