import express from "express";
import {
  createPost,
  getPostsByCircle,
  toggleLikePost,
  commentOnPost,
  replyToComment,
  deletePost,
  deleteComment,
  editPost
} from "../controllers/postController.js";

const router = express.Router();

// CREATE POST
router.post("/create", createPost);

// GET POSTS OF A CIRCLE  (IMPORTANT: FIXED)
router.get("/circle/:circle_id", getPostsByCircle);

// LIKE / UNLIKE POST
router.patch("/:postId/like", toggleLikePost);

// Reply to a comment — must come first
router.post("/posts/:postId/comment/:commentId/reply", replyToComment); 

// Add a new top-level comment
router.post("/:postId/comment", commentOnPost);


// DELETE COMMENT
router.delete("/:postId/comment/:commentId", deleteComment);

// EDIT POST
router.patch("/:postId", editPost);

// DELETE POST
router.delete("/:postId", deletePost);

export default router;
