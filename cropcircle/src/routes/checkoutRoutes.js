import express from 'express';
const router = express.Router();
import {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrdersByUser,
  getOrderStats
} from '../controllers/checkoutController.js';

router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/stats/summary', getOrderStats);
router.get('/:orderId', getOrderById);
router.put('/:orderId/status', updateOrderStatus);
router.get('/user/:userId', getOrdersByUser);

export default router;