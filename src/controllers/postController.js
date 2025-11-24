
import Post from "../models/postModel.js";
import CropCircle from "../models/cropCircleModel.js";
import Notification from "../models/notificationModel.js";  
import path from "path";
import fs from "fs";


export const createPost = async (req, res) => {
  try {
    const { user_id, circle_id, content, type } = req.body;
    let media_url = null;

    if (req.file) {
      media_url = `/uploads/${req.file.filename}`;
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

    // ------------------------------------------------
    // CHECK IF THE CREATOR IS A MENTOR
    // ------------------------------------------------
    const creator = await User.findById(user_id).select("name experience_level");

    const isMentor = creator?.experience_level === "expert";

    // If mentor created ANY post → notify all circle members except mentor
    if (isMentor) {
      const circle = await CropCircle.findById(circle_id).select("members");

      const otherMembers = circle.members.filter(
        m => m.toString() !== user_id.toString()
      );

      for (let memberId of otherMembers) {
        await Notification.create({
          receiver: memberId,
          sender: user_id,
          type: "MENTOR_POST",
          post_id: newPost._id,
          message: `${creator.name} (Mentor) posted in your Circle`,
          isActive: false
        });
      }
    }

    // --------------------------------------------------------
    // IF normal user posts a QUESTION → notify only mentors
    // --------------------------------------------------------
    if (type === "question" && !isMentor) {
      const circle = await CropCircle.findById(circle_id).populate(
        "mentors",
        "name"
      );

      if (circle?.mentors?.length > 0) {
        for (let mentor of circle.mentors) {
          if (mentor._id.toString() === user_id.toString()) continue;

          await Notification.create({
            receiver: mentor._id,
            sender: user_id,
            type: "MENTOR_QUESTION",
            post_id: newPost._id,
            message: `${creator.name} posted a question`,
            isActive: true // stays pinned until mentor answers
          });
        }
      }
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

    const post = await Post.findById(postId).populate("user_id", "name");
    if (!post) {
      console.log("[TOGGLE LIKE] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    const index = post.likes.indexOf(user_id);
    const isLike = index === -1;

    if (isLike) {
      post.likes.push(user_id);

      // ------------------------------------------------------------------
      // NOTIFICATION: SEND ONLY WHEN POST OWNER IS NOT THE SAME USER
      // ------------------------------------------------------------------
      if (post.user_id._id.toString() !== user_id) {
        await Notification.create({
          receiver: post.user_id._id,
          sender: user_id,
          type: "LIKE",
          post_id: post._id,
          message: `Someone liked your post`,
          isActive: false
        });
      }

    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    console.log("[TOGGLE LIKE] Like toggled. Total likes:", post.likes.length);

    res.status(200).json({
      message: isLike ? "Liked" : "Unliked",
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

    const post = await Post.findById(postId).populate("user_id", "name");
    if (!post) {
      console.log("[COMMENT] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the user to check if they are a mentor
    const user = await User.findById(user_id).select("role");
    const isMentor = user?.role === "mentor";

    // Add comment
    post.comments.push({ user_id, text });

    // Only unpin if MENTOR commented on a question post
    if (post.type === "question" && post.pinned && isMentor) {
      post.pinned = false;
      post.answered_at = new Date();
      console.log("[COMMENT] Post UNPINNED because mentor commented.");
    }

    await post.save();
    console.log("[COMMENT] Comment added. Total comments:", post.comments.length);

    // ----------------------------------------------------------
    // NOTIFICATION: SEND TO POST OWNER IF COMMENTER IS DIFFERENT
    // ----------------------------------------------------------
    if (post.user_id._id.toString() !== user_id) {
      await Notification.create({
        receiver: post.user_id._id,
        sender: user_id,
        type: "COMMENT",
        post_id: post._id,
        message: `Someone commented on your post`,
        isActive: false
      });
    }

    const populated = await Post.findById(postId)
      .populate("user_id", "name profile_photo")
      .populate("comments.user_id", "name profile_photo role")
      .populate("comments.replies.user_id", "name profile_photo role");

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
    const post = await Post.findById(postId).populate("user_id", "name");
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Find parent comment
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found in post" });

    // Add reply
    comment.replies.push({ user_id, text });
    await post.save();

    const replier = await User.findById(user_id).select("name experience_level");
    const commentOwnerId = comment.user_id;

    const isReplyToSelf = String(commentOwnerId) === String(user_id);
    const isMentor = replier.experience_level === "expert";

    // ------------------------------------
    // 🔔 1. Send notification to comment owner (not to self)
    // ------------------------------------
    if (!isReplyToSelf) {
      await Notification.create({
        receiver: commentOwnerId,
        sender: user_id,
        post_id: postId,
        type: isMentor ? "MENTOR_REPLY" : "REPLY",
        message: isMentor
          ? `${replier.name} (mentor) replied to your comment`
          : `${replier.name} replied to your comment`,
        isActive: false,
      });
    }

    // ------------------------------------
    // 🔔 2. Send notification to post owner (if different)
    // ------------------------------------
    if (String(post.user_id._id) !== String(user_id) && String(post.user_id._id) !== String(commentOwnerId)) {
      await Notification.create({
        receiver: post.user_id._id,
        sender: user_id,
        post_id: postId,
        type: "REPLY_ON_POST",
        message: `${replier.name} replied under your post`,
        isActive: false,
      });
    }

    res.status(200).json({ message: "Reply added", post });

  } catch (err) {
    console.error("[REPLY ERROR]", err);
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
