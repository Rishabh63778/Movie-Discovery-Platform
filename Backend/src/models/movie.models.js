import mongoose from "mongoose"
import mongooseaggregate from "mongoose-aggregate-paginate-v2"

const movieschema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    video: {
        url: String,
        public_id: String,
        duration: Number,
        format: String,
        bytes: Number
    },

    poster: {
        url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
        }
    },

    type: {
        type: String,
        enum: ["movie", "series"],
        required: true
    },

    description: {
        type: String,
        required: true
    },

    year: {
        type: Number,
        required: true
    },

    rating: {
        type: Number,
        default: 1.0
    },

    cast: {
        type: [{
            actor: String,
            character: String
        }],
        default: []
    },

    duration: {
        type: Number
    },

    genre: [
        {
            type: String,
            required: true
        }
    ],

    seasons: {
        type: Number,
        required: function () {
            return this.type === "series"
        }
    },

    episodes: {
        type: Number,
        required: function () {
            return this.type === "series"
        }
    }

}, { timestamps: true })

movieschema.plugin(mongooseaggregate)

export const movie = mongoose.model("movie", movieschema)