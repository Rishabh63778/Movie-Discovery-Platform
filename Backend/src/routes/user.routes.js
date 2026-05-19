import { Router } from "express"
import { registeruser, loginuser, logoutuser, refreshAccessToken, changepassword, getcurrentuser, updateuserdetails } from "../controllers/user.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"

const router = Router()

router.route("/register").post(registeruser)

router.route("/login").post(loginuser)
router.route("/logout").post(verifyJWT, logoutuser)
router.route("/refresh").post(refreshAccessToken)
router.route("/change-password").patch(verifyJWT, changepassword)
router.route("/currentuser").get(verifyJWT, getcurrentuser)
router.route("/update-account").patch(verifyJWT, updateuserdetails)

export default router