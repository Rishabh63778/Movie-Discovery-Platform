import {Router} from "express"
import { addmovie,getallmovies,getmovie,updatemovie,deletemovie, searchmovie ,uploadMovieVideo,deleteMovieVideo } from "../controllers/movie.controller.js"
import { upload } from "../middleware/multer.middleware.js"
import { uploadMovie } from "../middleware/multer.video.middleware.js"

const router=Router()

router.route("/addmovie").post(upload.single("poster"),addmovie)
router.route("/").get(getallmovies)
router.route("/search").get(searchmovie)
router.route("/:movieId").get(getmovie)
router.route("/:movieId").patch(upload.single("poster"),updatemovie)
router.route("/:movieId").delete(deletemovie)
router.route("/upload/:movieId").post(uploadMovie.single("video"),uploadMovieVideo)
router.route("/delete-video/:movieId").delete(deleteMovieVideo)



export default router