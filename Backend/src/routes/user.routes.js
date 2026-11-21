import { Router } from "express"
import { registeruser, loginuser, logoutuser, refreshAccessToken, changepassword, getcurrentuser, updateuserdetails, updateavatar } from "../controllers/user.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"
import { avatarUpload } from "../middleware/upload.middleware.js"

const router = Router()

router.route("/register").post(registeruser)

router.route("/login").post(loginuser)
router.route("/logout").post(verifyJWT, logoutuser)
router.route("/refresh").post(refreshAccessToken)
router.route("/change-password").patch(verifyJWT, changepassword)
router.route("/currentuser").get(verifyJWT, getcurrentuser)
router.route("/update-account").patch(verifyJWT, updateuserdetails)
router.route("/avatar").patch(verifyJWT, avatarUpload, updateavatar)

export default router