import express from "express";
import {
  createPost,
  getPostsByCircle,
  toggleLikePost,
  commentOnPost,
  replyToComment,
  deletePost,
  deleteComment,
  editPost,
  unpinPost
} from "../controllers/postController.js";
import upload from "../middleware/upload.js";



const router = express.Router();

// CREATE POST

router.post("/create", upload.single("image"), createPost);

// GET POSTS OF A CIRCLE  (IMPORTANT: FIXED)
router.get("/circle/:circle_id", getPostsByCircle);

// LIKE / UNLIKE POST
router.patch("/:postId/like", toggleLikePost);

router.post("/:postId/comment/:commentId/reply", replyToComment); // MUST come first
router.post("/:postId/comment", commentOnPost); // top-level comment
router.put("/unpin/:postId", unpinPost);





// Add a new top-level comment



// DELETE COMMENT
router.delete("/:postId/comment/:commentId", deleteComment);

// EDIT POST
router.patch("/:postId", editPost);

// DELETE POST
router.delete("/:postId", deletePost);



// TEST: Create a fake notification
router.post("/test/create", async (req, res) => {
  try {
    const { receiver, sender, type, post_id, message } = req.body;

    const notif = await Notification.create({
      receiver,
      sender,
      type,
      post_id,
      message,
      isActive: false,
      isRead: false
    });

    res.json({ success: true, notif });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;



