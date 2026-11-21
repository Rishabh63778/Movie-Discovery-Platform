import { Router } from "express"
import { getcurrentuser } from "../controllers/user.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"

const router = Router()

// Alias for the existing authenticated-user endpoint. Reuses the same
// controller, middleware and MongoDB user model as /users/currentuser.
router.route("/me").get(verifyJWT, getcurrentuser)

export default router
