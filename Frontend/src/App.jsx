import { Routes, Route } from "react-router-dom"
import Auth from "./pages/Auth.jsx"
import Register from "./pages/Register.jsx"
import Login from "./pages/Login.jsx"
import Home from "./pages/Home.jsx"
import MovieDisplay from "./pages/MovieDisplay.jsx"
import Person from "./pages/Person.jsx"
import Favourites from "./pages/Favourites.jsx"
import Profile from "./pages/Profile.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />}></Route>
        <Route path="/home" element={<Home />}></Route>
        <Route path="/favourites" element={
          <ProtectedRoute>
            <Favourites />
          </ProtectedRoute>
        }></Route>
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }></Route>
        <Route path="/movie/:id" element={<MovieDisplay />} />
        <Route path="/person/:id" element={<Person />} />
      </Routes>
    </>
  )
}

export default App
