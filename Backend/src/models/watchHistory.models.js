import mongoose from "mongoose"

const watchhistoryschema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
    },

    movieId: {
        type: Number,
        required: true,
        min: 1
    },

    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    watchedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: "user_watch_history"
})

watchhistoryschema.index({ user: 1, movieId: 1 }, { unique: true })
watchhistoryschema.index({ user: 1, watchedAt: -1 })

export const watchHistory = mongoose.model("watchHistory", watchhistoryschema)
