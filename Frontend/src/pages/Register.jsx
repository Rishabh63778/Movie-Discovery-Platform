import { useState } from "react"
import api from "../api/axios.js"
import { useNavigate, Link } from "react-router-dom"
import "../styles/Register.css"

function Register() {
    const [formData, setformData] = useState({
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
        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match")
        }
        try {
            setLoading(true)
            await api.post("/users/register", {
                username: formData.username,
                email: formData.email,
                password: formData.password
            })
            navigate("/login")
        }
        catch (error) {
            setError(error.response?.data?.message || "Registration failed")
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="Register">
                <form className="Register-Box" onSubmit={handleSubmit}>
                    <h1>Create Account</h1>
                    {
                        error && <p className="Error">{error}</p>
                    }
                    <input type="text" name="username" placeholder="Enter username" value={formData.username} onChange={handleChange} required />
                    <input type="email" name="email" placeholder="Enter email" value={formData.email} onChange={handleChange} required />
                    <input type="password" name="password" placeholder="Enter password" value={formData.password} onChange={handleChange} required />
                    <input type="password" name="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} required />
                    <button type="submit">
                        {
                            loading ? "Creating..." : "Register"
                        }
                    </button>
                    <p>Already have an account?
                        <Link to="/login">Login</Link>
                    </p>
                </form>
            </div>
        </>
    )
}

export default Register