import Notification from "../models/notificationModel.js";

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notes = await Notification.find({ receiver: userId })
      .populate("sender", "name profile_photo")
      .populate("post_id")
      .sort({ isActive: -1, createdAt: -1 });

    res.json({ notifications: notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndUpdate(notificationId, { isRead: true });

    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deactivateMentorQuestion = async (req, res) => {
  try {
    const { postId } = req.params;

    await Notification.updateMany(
      { post_id: postId, type: "MENTOR_QUESTION" },
      { isActive: false }
    );

    res.json({ message: "Notification moved down" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
