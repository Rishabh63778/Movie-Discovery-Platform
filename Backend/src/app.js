import express from "express"
import cors from "cors"
import userRouter from "./routes/user.routes.js"
import watchHistoryRouter from "./routes/watchHistory.routes.js"
import movieRouter from "./routes/movie.routes.js"
import cookieparser from "cookie-parser"
const app = express()

app.get('/',(req,res)=>{
    res.send("mongodb connected")
})

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json())
app.use(express.static("public"))
app.use(cookieparser())

app.use("/users",userRouter)
app.use("/watch-history",watchHistoryRouter)
app.use("/movies",movieRouter)

export default app