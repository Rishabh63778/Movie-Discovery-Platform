import mongoose from "mongoose"

const favouriteschema = new mongoose.Schema({
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
    }
}, {
    timestamps: true,
    collection: "user_favourites"
})

favouriteschema.index({ user: 1, movieId: 1 }, { unique: true })

export const favourite = mongoose.model("favourite", favouriteschema)
