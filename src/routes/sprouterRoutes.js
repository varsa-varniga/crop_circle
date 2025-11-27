import express from 'express';
const router = express.Router();
import {
  createSprouter,
  getSprouter,
  updateSprouter,
  getAllSprouters
} from '../controllers/sprouterController.js';

router.post('/profile', createSprouter);
router.get('/profile', getSprouter);
router.put('/profile', updateSprouter);
router.get('/all', getAllSprouters);

export default router;