import "../styles/Login.css"
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth.js"

function Login() {
    const [formData, setFormData] = useState({
        identifier: "",
        password: ""
    })

    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const successMessage = location.state?.message

    const handleChange = (e) => {
        setFormData({
            ...formData, [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        const identifier = formData.identifier.trim()

        if (!identifier || !formData.password) {
            setError("Enter your username or email and password.")
            return
        }

        try {
            setLoading(true)

            const credentials = identifier.includes("@")
                ? { email: identifier, password: formData.password }
                : { username: identifier, password: formData.password }

            await login(credentials)
            navigate(location.state?.from || "/home", { replace: true })
        }
        catch (error) {
            setError(error.response?.data?.message || "Login failed. Please try again.")
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <div className="Login">
            <div className="Login-Box">
                <Link to="/" className="Login-Brand">
                    CineScope<span>.</span>
                </Link>

                <div className="Login-Header">
                    <h1>Welcome back</h1>
                    <p>Sign in to continue your movie journey.</p>
                </div>

                {
                    successMessage && (
                        <p className="Login-Success" role="status">
                            {successMessage}
                        </p>
                    )
                }

                {
                    error && (
                        <p className="Login-Error" role="alert">
                            {error}
                        </p>
                    )
                }

                <form className="Login-Form" onSubmit={handleSubmit}>
                    <label className="Login-Field">
                        <span>Username or email</span>
                        <input
                            type="text"
                            name="identifier"
                            placeholder="Enter your username or email"
                            value={formData.identifier}
                            onChange={handleChange}
                            autoComplete="username"
                            required
                        />
                    </label>

                    <label className="Login-Field">
                        <span>Password</span>

                        <div className="Login-Password">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="Login-Password-Toggle"
                                onClick={() => setShowPassword((current) => !current)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </label>

                    <button
                        type="submit"
                        className="Login-Submit"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="Login-Redirect">
                    New to CineScope? <Link to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    )
}

export default Login
