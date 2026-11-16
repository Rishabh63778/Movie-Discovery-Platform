import { Router } from "express"
import {
    getwatchhistory,
    getcontinuewatching,
    updatewatchhistory,
    deletewatchhistory
} from "../controllers/watchHistory.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"

const router = Router()

router.route("/continue-watching").get(verifyJWT, getcontinuewatching)

router.route("/")
    .get(verifyJWT, getwatchhistory)
    .put(verifyJWT, updatewatchhistory)
    .patch(verifyJWT, updatewatchhistory)

router.route("/:movieId").delete(verifyJWT, deletewatchhistory)

export default router
