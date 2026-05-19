import dotenv from 'dotenv';
dotenv.config();
import connectDB from './db/db.js';
import app from './app.js'

const port = process.env.PORT || 4000

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });

    })
    .catch((err) => {
        console.log("MongoDB connection failed !!! ", err);
    });