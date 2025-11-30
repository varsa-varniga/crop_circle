import express from "express";
import {
  getNotifications,
  markAsRead,
  deactivateMentorQuestion
} from "../controllers/notificationController.js";
import Notification from "../models/notificationModel.js"; 


const router = express.Router();

// GET all notifications for user
router.get("/:userId", getNotifications);

// Mark notification as read
router.put("/read/:notificationId", markAsRead);

// Deactivate mentor question (when answered)
router.put("/deactivate/:postId", deactivateMentorQuestion);




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
