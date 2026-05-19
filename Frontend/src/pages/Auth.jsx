import { Link } from "react-router-dom"
import "../styles/Auth.css"

function Auth() {
    return (
        <>
            <div className="Auth">
                <div className="Auth-Box">
                    <h1> Welcome</h1>
                    <div className="Auth-Buttons">
                        <Link to="/login">
                            <button className="login-button">Login</button>
                        </Link>

                        <Link to="/register">
                            <button className="register-button">Register</button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Auth