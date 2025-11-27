import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  type: {
    type: String,
    enum: [
      "MENTOR_QUESTION",
      "MENTOR_POST",
      "NEW_MEMBER",
      "LIKE",
      "COMMENT",
      "REPLY",
      "MENTOR_COMMENT"
    ],
    required: true
  },

  post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  circle_id: { type: mongoose.Schema.Types.ObjectId, ref: "CropCircle" },

  message: { type: String, required: true },

  isActive: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },

}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
