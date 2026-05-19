import { Router } from "express"
import { givewatchHistory, updateWatchHistory, deleteWatchHistory,getContinueWatching } from "../controllers/watchHistory.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"

const router = Router()

router.route("/")
    .get(verifyJWT, givewatchHistory)
    .patch(verifyJWT, updateWatchHistory)
    
router.route("/:movieId").delete(verifyJWT, deleteWatchHistory)
router.route("/continue-watching").get(verifyJWT,getContinueWatching)

export default router