import { v2 as cloudinary } from "cloudinary"
import ApiError from "../utils/apierror.js"

const AVATAR_FOLDER = "cinescope/avatars"
const AVATAR_TRANSFORMATION = [
    { width: 500, height: 500, crop: "fill", gravity: "face" },
    { quality: "auto", fetch_format: "auto" }
]

let isConfigured = false

const configureCloudinary = () => {
    if (isConfigured) return

    const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim()

    if (cloudinaryUrl) {
        try {
            const parsed = new URL(cloudinaryUrl)
            const cloudName = parsed.hostname
            const apiKey = decodeURIComponent(parsed.username)
            const apiSecret = decodeURIComponent(parsed.password)

            if (!cloudName || !apiKey || !apiSecret) {
                throw new Error("Incomplete Cloudinary URL")
            }

            cloudinary.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true
            })

            isConfigured = true
            return
        } catch {
            throw new ApiError(500, "CLOUDINARY_URL is not valid")
        }
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

    if (!cloudName || !apiKey || !apiSecret) {
        throw new ApiError(
            500,
            "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET"
        )
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
    })

    isConfigured = true
}

const uploadAvatar = async (file, userId) => {
    configureCloudinary()

    if (!file?.buffer?.length) {
        throw new ApiError(400, "Profile picture is required")
    }

    const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: AVATAR_FOLDER,
                public_id: `user_${userId}`,
                overwrite: true,
                invalidate: true,
                resource_type: "image",
                timeout: 60000,
                transformation: AVATAR_TRANSFORMATION
            },
            (error, uploadResult) => {
                if (error) {
                    reject(error)
                    return
                }

                resolve(uploadResult)
            }
        )

        uploadStream.end(file.buffer)
    }).catch((error) => {
        console.error("Cloudinary avatar upload failed:", error?.message || error)

        if (error?.http_code === 401) {
            throw new ApiError(
                500,
                "Cloudinary credentials are invalid. Update CLOUDINARY_URL (or the CLOUDINARY_* variables) and restart the server"
            )
        }

        throw new ApiError(
            502,
            "Could not upload the profile picture. Please try again"
        )
    })

    if (!result?.secure_url) {
        throw new ApiError(502, "Cloudinary did not return an image URL")
    }

    return {
        url: result.secure_url,
        publicId: result.public_id
    }
}

export { uploadAvatar }
