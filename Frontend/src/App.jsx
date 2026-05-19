import {  Routes, Route } from "react-router-dom"
import Auth from "./pages/Auth.jsx"
import Register from "./pages/Register.jsx"
import Login from "./pages/Login.jsx"
import Home from "./pages/Home.jsx"
function App() {
  return (
    <>
        <Routes>
          <Route path="/" element={<Auth/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/login" element={<Login/>}></Route>
          <Route path="/home" element={<Home/>}></Route>
        </Routes>
    </>
  )
}

export default App
