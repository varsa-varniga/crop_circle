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

router.post("/:postId/comment/:commentId/reply", replyToComment); // MUST come first
router.post("/:postId/comment", commentOnPost); // top-level comment




// Add a new top-level comment



// DELETE COMMENT
router.delete("/:postId/comment/:commentId", deleteComment);

// EDIT POST
router.patch("/:postId", editPost);

// DELETE POST
router.delete("/:postId", deletePost);

export default router;
