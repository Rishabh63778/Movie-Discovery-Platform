import dotenv from "dotenv"
dotenv.config()

import cloudinary from "cloudinary"
import fs from "fs"

const cloudinaryv2 = cloudinary.v2

cloudinaryv2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadoncloudinary = async (localFilePath) => {

    try {

        if (!localFilePath) return null

        const response = await cloudinaryv2.uploader.upload(
            localFilePath,
            {
                resource_type: "auto"
            }
        )

        fs.unlinkSync(localFilePath)

        return response

    } catch (error) {

        console.log(error)

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }

        return null
    }
}

export default uploadoncloudinary