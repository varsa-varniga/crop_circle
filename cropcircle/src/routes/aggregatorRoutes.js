import express from 'express';
import {
  addListing,
  getListings,
  getFarmers,
  createOrder,
  getOrders,
  updateOrderStatus,
  logCollection,
  getCollections
} from '../controllers/aggregatorController.js';

const router = express.Router();

// Farmer listing routes
router.post('/listings', addListing);
router.get('/listings', getListings);

// Farmer routes
router.get('/farmers', getFarmers);

// Order routes
router.post('/orders', createOrder);
router.get('/orders', getOrders);
router.put('/orders/:id', updateOrderStatus);

// Collection routes
router.post('/collection', logCollection);
router.get('/collection', getCollections);

export default router;