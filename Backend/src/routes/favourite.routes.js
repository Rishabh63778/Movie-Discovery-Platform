import { Router } from "express"
import {
    getfavourites,
    addfavourite,
    removefavourite,
    checkfavourite
} from "../controllers/favourite.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"

const router = Router()

router.route("/")
    .get(verifyJWT, getfavourites)
    .post(verifyJWT, addfavourite)

router.route("/:movieId")
    .get(verifyJWT, checkfavourite)
    .delete(verifyJWT, removefavourite)

export default router
