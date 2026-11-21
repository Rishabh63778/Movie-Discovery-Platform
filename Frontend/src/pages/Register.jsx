import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api/axios.js"
import "../styles/Register.css"

function Register() {
    const [formData, setformData] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    })

    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleChange = (e) => {
        setformData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        const fullName = formData.fullName.trim()
        const username = formData.username.trim()
        const email = formData.email.trim()

        if (!fullName) {
            return setError("Please enter your full name.")
        }

        if (!username) {
            return setError("Please choose a username.")
        }

        if (!email) {
            return setError("Please enter your email address.")
        }

        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match.")
        }

        try {
            setLoading(true)

            await api.post("/users/register", {
                fullName,
                username,
                email,
                password: formData.password
            })

            navigate("/login", {
                replace: true,
                state: { message: "Account created successfully. Please sign in." }
            })
        }
        catch (error) {
            setError(error.response?.data?.message || "Registration failed. Please try again.")
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <div className="Register">
            <div className="Register-Box">
                <Link to="/" className="Register-Brand">
                    CineScope<span>.</span>
                </Link>

                <div className="Register-Header">
                    <h1>Create your account</h1>
                    <p>Join CineScope and start building your watchlist.</p>
                </div>

                {
                    error && (
                        <p className="Register-Error" role="alert">
                            {error}
                        </p>
                    )
                }

                <form className="Register-Form" onSubmit={handleSubmit}>
                    <label className="Register-Field">
                        <span>Full name</span>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Enter your real full name"
                            value={formData.fullName}
                            onChange={handleChange}
                            autoComplete="name"
                            required
                        />
                    </label>

                    <label className="Register-Field">
                        <span>Username</span>
                        <input
                            type="text"
                            name="username"
                            placeholder="Choose a username"
                            value={formData.username}
                            onChange={handleChange}
                            autoComplete="username"
                            required
                        />
                    </label>

                    <label className="Register-Field">
                        <span>Email address</span>
                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label className="Register-Field">
                        <span>Password</span>
                        <input
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                        />
                    </label>

                    <label className="Register-Field">
                        <span>Confirm password</span>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className="Register-Submit"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="Register-Redirect">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    )
}

export default Register
