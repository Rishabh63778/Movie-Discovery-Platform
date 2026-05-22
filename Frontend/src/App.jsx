import { Routes, Route } from "react-router-dom"
import Auth from "./pages/Auth.jsx"
import Register from "./pages/Register.jsx"
import Login from "./pages/Login.jsx"
import Home from "./pages/Home.jsx"
import MovieDisplay from "./pages/MovieDisplay.jsx"
import WatchMovie from "./pages/WatchMovie.jsx"
import Player from "./pages/Player.jsx"
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />}></Route>
        <Route path="/home" element={<Home />}></Route>
        <Route path="/movie/:id" element={<MovieDisplay />} />
        <Route path="/watch/:id" element={<WatchMovie />}/>
        <Route path="/player" element={<Player />} />
      </Routes>
    </>
  )
}

export default App
