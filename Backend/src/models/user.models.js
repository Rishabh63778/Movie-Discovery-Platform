import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userschema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    
    RefreshToken:{
        type:String
    }

}, { timestamps: true })

userschema.pre("save",async function(){
    if(!this.isModified("password")) return ;
    this.password=await bcrypt.hash(this.password,10)
})

userschema.methods.checkpassword=async function(password){
    return await bcrypt.compare(password,this.password)
}

userschema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userschema.methods.generateRefreshToken= function(){
     return jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const user = mongoose.model("user", userschema)