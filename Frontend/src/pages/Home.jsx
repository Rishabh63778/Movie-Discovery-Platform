import { useEffect, useState } from "react"
import api from "../api/axios.js"
import "../styles/Home.css"
import { useNavigate } from "react-router-dom"

function Home() {
    const navigate = useNavigate()

    const [movies, setmovies] = useState([])
    const [actionmovies, setactionmovies] = useState([])

    const [search, setsearch] = useState("")
    const [loading, setloading] = useState(false)

    const fetchmovies = async () => {

        try {

            setloading(true)

            const response = await api.get("/movies")

            setmovies(response.data.data.docs)

        } catch (error) {
            console.log(error)
        } finally {
            setloading(false)
        }
    }

    const fetchactionmovies = async () => {

        try {

            const response = await api.get(
                "/movies?genre=action"
            )

            setactionmovies(response.data.data.docs)

        } catch (error) {
            console.log(error)
        }
    }

    const handlesearch = async () => {

        if (!search.trim()) {
            fetchmovies()
            return
        }

        try {

            setloading(true)

            const response = await api.get(
                `/movies/search?query=${search}`
            )

            setmovies(response.data.data.docs)

        } catch (error) {
            console.log(error)
        } finally {
            setloading(false)
        }
    }

    useEffect(() => {

        fetchmovies()
        fetchactionmovies()

    }, [])

    return (
        <div className="Home">

            <div className="Hero">

                <div className="Hero-Content">

                    <h1>
                        Unlimited Movies, TV Shows & More
                    </h1>

                    <p>
                        Watch anywhere. Stream your favorite
                        content anytime.
                    </p>

                    <div className="Search-Bar">

                        <input
                            type="text"
                            placeholder="Search movies..."
                            value={search}
                            onChange={(e) =>
                                setsearch(e.target.value)
                            }
                        />

                        <button onClick={handlesearch}>
                            Search
                        </button>

                    </div>

                </div>

            </div>

            <div className="Movies-Section">

                <h2>
                    {
                        search.trim()
                            ? `Search Results for "${search}"`
                            : "Trending Movies"
                    }
                </h2>

                {
                    loading ? (

                        <p className="Loading">
                            Loading movies...
                        </p>

                    ) : (

                        <div className="Movie-Grid">

                            {
                                movies.length > 0 ? (

                                    movies.map((movie) => (

                                        <div
                                            className="Movie-Card"
                                            key={movie._id}
                                            onClick={() => navigate(`/movie/${movie._id}`)}
                                        >

                                            <img
                                                src={movie.poster?.url}
                                                alt={movie.title}
                                            />

                                            <div className="Movie-Info">

                                                <h3>
                                                    {movie.title}
                                                </h3>

                                                <p>
                                                    ⭐ {
                                                        movie.rating || "N/A"
                                                    }
                                                </p>

                                                <p>
                                                    {movie.year}
                                                </p>

                                            </div>

                                        </div>
                                    ))

                                ) : (

                                    <p className="No-Movies">
                                        {
                                            search.trim()
                                                ? `No movies found for "${search}"`
                                                : "No movies available"
                                        }
                                    </p>

                                )
                            }

                        </div>

                    )
                }

            </div>

            {
                !search.trim() && (

                    <div className="Movies-Section">

                        <h2>
                            Action Movies
                        </h2>

                        <div className="Movie-Grid">

                            {
                                actionmovies.length > 0 ? (

                                    actionmovies.map((movie) => (

                                        <div
                                            className="Movie-Card"
                                            key={movie._id}
                                        >

                                            <img
                                                src={movie.poster?.url}
                                                alt={movie.title}
                                            />

                                            <div className="Movie-Info">

                                                <h3>
                                                    {movie.title}
                                                </h3>

                                                <p>
                                                    ⭐ {
                                                        movie.rating || "N/A"
                                                    }
                                                </p>

                                                <p>
                                                    {movie.year}
                                                </p>

                                            </div>

                                        </div>
                                    ))

                                ) : (

                                    <p className="No-Movies">
                                        No Action Movies Found
                                    </p>

                                )
                            }

                        </div>

                    </div>
                )
            }

        </div>
    )
}

export default Home