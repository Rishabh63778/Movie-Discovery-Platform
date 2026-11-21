import multer from "multer"
import ApiError from "../utils/apierror.js"

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
])

const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_AVATAR_SIZE,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            callback(
                new ApiError(400, "Profile picture must be a JPEG, PNG or WebP image")
            )
            return
        }

        callback(null, true)
    }
}).single("avatar")

export { avatarUpload }
