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

        const response = await new Promise((resolve, reject) => {

            cloudinaryv2.uploader.upload_large(
                localFilePath,
                {
                    resource_type: "auto",
                },
                (error, result) => {

                    if (error) {
                        reject(error)
                    } else {
                        resolve(result)
                    }
                }
            )
        })

        fs.unlink(localFilePath, (err) => {
            if (err) console.log(err)
        })

        return response

    } catch (error) {

        console.log(error)

        if (fs.existsSync(localFilePath)) {

            fs.unlink(localFilePath, (err) => {
                if (err) console.log(err)
            })
        }

        return null
    }
}

export default uploadoncloudinary