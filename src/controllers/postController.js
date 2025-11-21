
import Post from "../models/postModel.js";
import CropCircle from "../models/cropCircleModel.js";
import path from "path";
import fs from "fs";
export const createPost = async (req, res) => {
  try {
    const { user_id, circle_id, content, type } = req.body;
    let media_url = null;

    // If an image is uploaded, set the media_url
    if (req.file) {
      media_url = `/uploads/${req.file.filename}`; // relative URL for frontend
    }

    if (!user_id || !circle_id || (!content && !media_url)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pinned = type === "question";

    const newPost = new Post({
      user_id,
      circle_id,
      content,
      media_url,
      type,
      pinned
    });

    await newPost.save();

    // Notify mentors for questions
    if (type === "question") {
      const circle = await CropCircle.findById(circle_id).populate("mentors", "name email");
      circle?.mentors?.forEach(mentor => {
        console.log(`Notify mentor ${mentor.name} about a new question.`);
      });
    }

    res.status(201).json({ message: "Post created", post: newPost });
  } catch (err) {
    console.error("[CREATE POST] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------------------------------------------
// GET POSTS BY CIRCLE
// ------------------------------------------------------------
export const getPostsByCircle = async (req, res) => {
  try {
    const { circle_id } = req.params;
    console.log("[GET POSTS] Circle ID:", circle_id);

    const posts = await Post.find({ circle_id })
      .populate("user_id", "name profile_photo")
      .populate("comments.user_id", "name profile_photo")
      .populate("comments.replies.user_id", "name profile_photo")
      .sort({ pinned: -1, createdAt: -1 });

    console.log("[GET POSTS] Found posts:", posts.length);

    const formattedPosts = posts.map(post => {
      const createdAt = post.createdAt || post._id.getTimestamp();
      return {
        ...post._doc,
        createdAt
      };
    });

    res.status(200).json({ posts: formattedPosts });
  } catch (err) {
    console.error("[GET POSTS] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------------------------------------------
// LIKE / UNLIKE POST
// ------------------------------------------------------------
export const toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;
    console.log("[TOGGLE LIKE] Post ID:", postId, "User ID:", user_id);

    const post = await Post.findById(postId);
    if (!post) {
      console.log("[TOGGLE LIKE] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    const index = post.likes.indexOf(user_id);
    if (index === -1) post.likes.push(user_id);
    else post.likes.splice(index, 1);

    await post.save();
    console.log("[TOGGLE LIKE] Like toggled. Total likes:", post.likes.length);

    res.status(200).json({
      message: index === -1 ? "Liked" : "Unliked",
      post
    });
  } catch (err) {
    console.error("[TOGGLE LIKE] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------------------------------------------
// ADD COMMENT
// ------------------------------------------------------------
export const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id, text } = req.body;
    console.log("[COMMENT] Post ID:", postId, "User ID:", user_id, "Text:", text);

    const post = await Post.findById(postId);
    if (!post) {
      console.log("[COMMENT] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({ user_id, text });
    if (post.type === "question" && post.pinned) {
      post.pinned = false;
      post.answered_at = new Date();
    }

    await post.save();
    console.log("[COMMENT] Comment added. Total comments:", post.comments.length);

    const populated = await Post.findById(postId)
      .populate("user_id", "name profile_photo")
      .populate("comments.user_id", "name profile_photo")
      .populate("comments.replies.user_id", "name profile_photo");

    res.status(201).json({ message: "Comment added", post: populated });
  } catch (err) {
    console.error("[COMMENT] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------------------------------------------
// REPLY TO COMMENT
// ------------------------------------------------------------
export const replyToComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const { user_id, text } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Find the comment by converting commentId to ObjectId
    const comment = post.comments.id(commentId); // Mongoose subdoc method
    if (!comment) return res.status(404).json({ message: "Comment not found in post" });

    comment.replies.push({ user_id, text });
    await post.save();

    res.status(200).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// ------------------------------------------------------------
// DELETE POST
// ------------------------------------------------------------
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;
    console.log("[DELETE POST] Post ID:", postId, "User ID:", user_id);

    const post = await Post.findById(postId);
    if (!post) {
      console.log("[DELETE POST] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user_id.toString() !== user_id) {
      console.log("[DELETE POST] Unauthorized");
      return res.status(403).json({ message: "You cannot delete this post" });
    }

    await Post.findByIdAndDelete(postId);
    console.log("[DELETE POST] Post deleted");

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("[DELETE POST] Error:", err);
    res.status(500).json({ message: err.message });
  }
};


// ------------------------------------------------------------
// DELETE COMMENT (Supports replies recursive)
// ------------------------------------------------------------
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { user_id } = req.body;
    console.log("[DELETE COMMENT] Post ID:", postId, "Comment ID:", commentId, "User ID:", user_id);

    const post = await Post.findById(postId).populate("comments.user_id");
    if (!post) {
      console.log("[DELETE COMMENT] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    function removeCommentRecursive(comments) {
      for (let i = 0; i < comments.length; i++) {
        let comment = comments[i];

        if (comment._id.toString() === commentId) {
          if (comment.user_id._id.toString() !== user_id) {
            return { error: "You cannot delete this comment" };
          }
          comments.splice(i, 1);
          return { success: true };
        }

        if (comment.replies?.length > 0) {
          let result = removeCommentRecursive(comment.replies);
          if (result?.success) return result;
          if (result?.error) return result;
        }
      }
      return null;
    }

    const result = removeCommentRecursive(post.comments);

    if (result?.error) {
      console.log("[DELETE COMMENT] Unauthorized");
      return res.status(403).json({ message: result.error });
    }
    if (!result?.success) {
      console.log("[DELETE COMMENT] Comment not found");
      return res.status(404).json({ message: "Comment not found" });
    }

    await post.save();
    console.log("[DELETE COMMENT] Comment deleted");
    res.json({ message: "Comment deleted", post });
  } catch (err) {
    console.error("[DELETE COMMENT] Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------
// EDIT POST
// ------------------------------------------------------------
export const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, media_url } = req.body;
    console.log("[EDIT POST] Post ID:", postId, "Content:", content, "Media URL:", media_url);

    const updated = await Post.findByIdAndUpdate(
      postId,
      { content, media_url },
      { new: true }
    );

    if (!updated) {
      console.log("[EDIT POST] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("[EDIT POST] Post updated");
    res.json({ message: "Post updated", post: updated });
  } catch (err) {
    console.error("[EDIT POST] Error:", err);
    res.status(500).json({ error: err.message });
  }
};
