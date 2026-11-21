import express from "express"
import cors from "cors"
import cookieparser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import authRouter from "./routes/auth.routes.js"
import movieRouter from "./routes/movie.routes.js"
import personRouter from "./routes/person.routes.js"
import searchRouter from "./routes/search.routes.js"
import favouriteRouter from "./routes/favourite.routes.js"
import watchHistoryRouter from "./routes/watchHistory.routes.js"
import { errorHandler, notFound } from "./middleware/error.middleware.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json())
app.use(cookieparser())

app.get("/", (req, res) => {
    res.send("Movie Discovery API is running")
})

app.use("/users", userRouter)
app.use("/api/auth", authRouter)
app.use("/movies", movieRouter)
app.use("/people", personRouter)
app.use("/search", searchRouter)
app.use("/favourites", favouriteRouter)
app.use("/watch-history", watchHistoryRouter)

app.use(notFound)
app.use(errorHandler)

export default app
