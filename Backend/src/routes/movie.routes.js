import { Router } from "express"
import { getallmovies, getmovie, searchmovie, getgenres } from "../controllers/movie.controller.js"

const router = Router()

router.route("/").get(getallmovies)
router.route("/search").get(searchmovie)
router.route("/genres").get(getgenres)
router.route("/:movieId").get(getmovie)

export default router
