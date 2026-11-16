import { Routes, Route } from "react-router-dom"
import Auth from "./pages/Auth.jsx"
import Register from "./pages/Register.jsx"
import Login from "./pages/Login.jsx"
import Home from "./pages/Home.jsx"
import MovieDisplay from "./pages/MovieDisplay.jsx"
import Favourites from "./pages/Favourites.jsx"


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />}></Route>
        <Route path="/home" element={<Home />}></Route>
        <Route path="/favourites" element={<Favourites />}></Route>
        <Route path="/movie/:id" element={<MovieDisplay />} />
      </Routes>
    </>
  )
}

export default App
