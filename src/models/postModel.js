import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  replies: [replySchema],
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    circle_id: { type: mongoose.Schema.Types.ObjectId, ref: "CropCircle", required: true },
    title: { type: String, required: true }, 
    content: { type: String },
    media_url: { type: String },
    type: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    pinned: { type: Boolean, default: false },
    answered_at: { type: Date, default: null }

  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
