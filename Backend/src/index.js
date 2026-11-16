import "dotenv/config"
import connectDB from "./db/db.js"
import app from "./app.js"

const port = process.env.PORT || 3000

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`)
        })
    })
    .catch((err) => {
        console.log("MongoDB connection failed !!! ", err)
        process.exit(1)
    })
