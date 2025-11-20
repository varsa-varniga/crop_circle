import express from "express";
import { 
  registerUser, 
  getUserProfile, 
  updateUserProfile,
  uploadProfilePhoto // ← import this from your controller
} from "../controllers/userController.js";

const router = express.Router();

// POST /api/users/register
router.post("/register", registerUser);

// GET /api/users/:user_id/profile → fetch user profile + posts
router.get("/:user_id/profile", getUserProfile);


// PATCH /api/users/:user_id/profile → update profile photo and bio
// Use multer middleware to handle uploaded profile photo
router.patch(
  "/:user_id/profile",
  uploadProfilePhoto.single("profile_photo"),
  updateUserProfile
);


export default router;
