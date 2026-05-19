import mongoose from "mongoose"

const watchHistorySchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "movie",
        required:true
    },
    watchedAt: {
        type: Date,
        default: Date.now
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }
})

watchHistorySchema.index(
    {user:1,movie:1},
    {unique:true}
)

export const watchHistory=mongoose.model("watchHistory",watchHistorySchema)