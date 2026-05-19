import "../styles/Login.css"
import { useState } from "react"
import api from "../api/axios.js"
import { Link,useNavigate } from "react-router-dom"

function Login() {
    const [formData, setformData] = useState({
        username: "",
        email: "",
        password: ""
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const navigate = useNavigate()

    const handleChange = (e) => {
        setformData({
            ...formData, [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        try {
            setLoading(true)
            const response = await api.post("/users/login", {
                username: formData.username,
                email: formData.email,
                password: formData.password
            })
            console.log(response.data)
            navigate("/home")
        }
        catch (error) {
            setError(error.response?.data?.message || "Login Failed")
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <div className="Login">
            <form className="Login-Box" onSubmit={handleSubmit}>
                <h1>Login</h1>
                {
                    error && <p className="Error">{error}</p>
                }
                <input type="text" name="username" placeholder="Enter Username" value={formData.username} onChange={handleChange}/>
                <p className="Or">OR</p>
                <input type="email" name="email" placeholder="Enter Email" value={formData.email} onChange={handleChange}/>
                <input type="password" name="password" placeholder="Enter password" value={formData.password} onChange={handleChange} required/>
                <button type="submit">
                    {
                        loading ? "Logging in...":"Login"
                    }
                </button>
                <p className="Redirect">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    )

}

export default Login