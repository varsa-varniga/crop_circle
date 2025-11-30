import express from "express";
import {
  getFarmProfile,
  saveFarmProfile,
  uploadFarmPhotos,
  getAllFarmProfiles
} from "../controllers/farmProfileController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public routes
router.route("/")
  .get(getAllFarmProfiles)
  .post(saveFarmProfile);

router.route("/:userId")
  .get(getFarmProfile);

router.route("/upload")
  .post(upload.array('photos', 10), uploadFarmPhotos);

export default router;