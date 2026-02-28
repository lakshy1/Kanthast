import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    contactNumber: {
        type: String,
        trim: true,
    },
    accountType: {
        type: String,
        enum: ["Admin", "Student", "Instructor"],
    },
    additionalDetails: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: "Profile",
    },
    courses: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ],
    image: {
       type:String,
       required: true, 
    },
    courseProgress: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"CourseProgress"
        }
    ],
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },

});

export default mongoose.model("User", userSchema);
