import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createLandListing,
  getAllLandListings,
  getLandById,
  updateLandListing,
  deleteLandListing,
  approveLandListing
} from '../controllers/landController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/', upload.fields([
  { name: 'ownership', maxCount: 5 },
  { name: 'identity', maxCount: 2 },
  { name: 'survey', maxCount: 3 },
  { name: 'bank', maxCount: 2 },
  { name: 'soilTest', maxCount: 2 },
  { name: 'photos', maxCount: 10 },
  { name: 'videos', maxCount: 3 }
]), createLandListing);

router.get('/', getAllLandListings);
router.get('/:id', getLandById);
router.put('/:id', updateLandListing);
router.delete('/:id', deleteLandListing);
router.put('/:id/approve', approveLandListing);

export default router;