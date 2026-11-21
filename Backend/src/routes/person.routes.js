import { Router } from "express"
import {
    getperson,
    getpersonawards
} from "../controllers/person.controller.js"

const router = Router()

router.route("/:personId/awards").get(getpersonawards)
router.route("/:personId").get(getperson)

export default router
