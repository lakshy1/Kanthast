import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      default: "English",
    },
    appearance: {
      type: String,
      enum: ["System", "Light", "Dark"],
      default: "Light",
    },
    defaultPlaybackSpeed: {
      type: String,
      default: "1x",
    },
    profileVisibility: {
      type: String,
      enum: ["public", "enrolled", "private"],
      default: "enrolled",
    },
    emailUpdates: {
      type: Boolean,
      default: true,
    },
    learningReminders: {
      type: Boolean,
      default: true,
    },
    courseAnnouncements: {
      type: Boolean,
      default: true,
    },
    subscriptionReminders: {
      type: Boolean,
      default: true,
    },
    productTips: {
      type: Boolean,
      default: false,
    },
    reduceMotion: {
      type: Boolean,
      default: false,
    },
    compactLayout: {
      type: Boolean,
      default: false,
    },
    analyticsSharing: {
      type: Boolean,
      default: true,
    },
    autoplayNextLecture: {
      type: Boolean,
      default: true,
    },
    showProgressPercent: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        // Assistant messages only: "ai" (a full model answer), "ai_hint" (a hint-mode nudge) or
        // "system" (a fixed or error reply). Missing on older messages, which count as "system".
        // Only "ai" may be carried into a class post. Server-side only: left out of JSON.
        source: {
            type: String,
            enum: ["ai", "ai_hint", "system"],
        },
        mediaType: {
            type: String,
            enum: ["", "video/mp4", "video"],
            default: "",
        },
        mediaUrl: {
            type: String,
            default: "",
        },
        thumbnailUrl: {
            type: String,
            default: "",
        },
        topic: {
            type: String,
            default: "",
            trim: true,
        },
        caption: {
            type: String,
            default: "",
            trim: true,
        },
        fileUrl: {
            type: String,
            default: "",
        },
        fileName: {
            type: String,
            default: "",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: false,
        toJSON: {
            transform: (doc, ret) => {
                delete ret.source;
                return ret;
            },
        },
    }
);

const chatSessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            default: "New Chat",
            trim: true,
        },
        messages: [chatMessageSchema],
        // The doubt this chat's answer was carried into. One chat, one doubt (see controllers/Doubts.js).
        postedDoubt: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false, timestamps: true }
);

const doubtsMuteSchema = new mongoose.Schema(
    {
        // Muted while permanent is true or until is in the future. Expiry needs no job.
        until: { type: Date, default: null },
        permanent: { type: Boolean, default: false },
        reason: { type: String, default: "", maxlength: 300 },
        mutedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
        mutedAt: { type: Date, default: null },
        // Bumped by every mute and unmute, so two admins at once cannot both apply theirs.
        version: { type: Number, default: 0 },
    },
    { _id: false }
);

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
    subscriptionPurchased: {
        type: Boolean,
        default: false,
    },
    subscriptionPurchasedOn: {
        type: Date,
        default: null,
    },
    subscriptionValidTill: {
        type: Date,
        default: null,
    },
    schoolClass: {
        type: String,
        enum: ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        default: "",
    },
    subscriptionPlan: {
        type: String,
        enum: ["", "school-class-1y"],
        default: "",
    },
    subscriptionAmount: {
        type: Number,
        default: 0,
    },
    subscriptionCurrency: {
        type: String,
        enum: ["", "INR"],
        default: "",
    },
    subscriptionPaymentId: {
        type: String,
        default: "",
    },
    settings: {
        type: userSettingsSchema,
        default: () => ({}),
    },
    chatHistory: [
        chatMessageSchema,
    ],
    chatSessions: [chatSessionSchema],
    // Doubts moderation: a muted student can read and use Ask AI but cannot post, reply or ask
    // for an AI answer in a thread. Checked against the time of each request (middleware/Doubts.js).
    // No default on purpose: a default would be written by any later user.save() (the chat saves the
    // user after a slow AI call) and could overwrite a mute set by an admin in the meantime.
    doubtsMute: {
        type: doubtsMuteSchema,
        default: undefined,
    },

}, { timestamps: true });

export default mongoose.model("User", userSchema);
