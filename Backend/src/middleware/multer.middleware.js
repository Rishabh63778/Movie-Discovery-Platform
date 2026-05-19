import multer from "multer"
import path from "path"
import fs from "fs"

const posterpath="./public/temp/posters"

if (!fs.existsSync(posterpath)) {
    fs.mkdirSync(posterpath, { recursive: true })
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null,posterpath)
    },

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)

        cb(
            null,
            uniqueSuffix + path.extname(file.originalname)
        )
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true)
    } 
    else {
        cb(new Error("Only image files are allowed"), false)
    }
}

export const upload = multer({
    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024 
    }
})