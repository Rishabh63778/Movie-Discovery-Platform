import multer from "multer"
import path from "path"
import fs from "fs"

const moviePath = "./public/temp/movies"

if (!fs.existsSync(moviePath)) {
    fs.mkdirSync(moviePath, { recursive: true })
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, moviePath)
    },

    filename: function (req, file, cb) {
        const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1E9)

        cb(
            null,
            uniqueSuffix + path.extname(file.originalname)
        )
    }
})

const fileFilter = function (req, file, cb) {

    const allowedMimeTypes = [
        "video/mp4",
        "video/x-matroska",
        "video/quicktime"
    ]

    const allowedExtensions = [".mp4", ".mkv", ".mov"]

    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true)
    } else {
        cb(new Error("Only MP4, MKV, and MOV files are allowed"), false)
    }
}

export const uploadMovie = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 2 * 1024 * 1024 * 1024 
    }
})