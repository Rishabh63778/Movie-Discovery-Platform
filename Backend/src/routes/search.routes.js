import { Router } from "express"
import { searchmulti } from "../controllers/search.controller.js"

const router = Router()

router.route("/multi").get(searchmulti)

export default router
