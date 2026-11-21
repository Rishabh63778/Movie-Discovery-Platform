import { Link } from "react-router-dom"
import { useAuth } from "../context/useAuth.js"
import ProfileDropdown from "./ProfileDropdown.jsx"
import "../styles/Navbar.css"

function Navbar() {
    const { user, loading } = useAuth()

    return (
        <header className="Top-Bar">
            <Link to="/home" className="Brand">
                CineScope
            </Link>

            <div className="Top-Bar-Right">
                <nav className="Top-Bar-Links" aria-label="Main navigation">
                    <Link to="/favourites">Favourites</Link>
                </nav>

                <div className="Top-Bar-Actions">
                    {
                        loading ? (
                            <span
                                className="Profile-Trigger-Skeleton"
                                aria-label="Loading profile"
                            />
                        ) : user ? (
                            <ProfileDropdown />
                        ) : (
                            <Link to="/login" className="Top-Bar-Login">
                                Login
                            </Link>
                        )
                    }
                </div>
            </div>
        </header>
    )
}

export default Navbar
