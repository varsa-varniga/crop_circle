import mongoose from 'mongoose';
import { 
  AggregatorFarmer, 
  AggregatorListing, 
  AggregatorOrder, 
  AggregatorCollection 
} from '../models/aggregatorModel.js';

// Add farmer listing
export const addListing = async (req, res) => {
  try {
    const { name, phone, crop, quantity, price } = req.body;

    // Create or get farmer
    let farmer = await AggregatorFarmer.findOne({ phone });
    if (!farmer) {
      farmer = new AggregatorFarmer({ name, phone });
      await farmer.save();
    }

    // Create listing
    const listing = new AggregatorListing({
      farmer_id: farmer._id,
      farmer_name: farmer.name,
      crop,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      originalQuantity: parseFloat(quantity)
    });

    await listing.save();

    res.json({
      success: true,
      farmer,
      listing
    });
  } catch (error) {
    console.error('Error adding listing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add listing' 
    });
  }
};

// Get all listings
export const getListings = async (req, res) => {
  try {
    const listings = await AggregatorListing.find().sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

// Get all farmers
export const getFarmers = async (req, res) => {
  try {
    const farmers = await AggregatorFarmer.find().sort({ createdAt: -1 });
    res.json(farmers);
  } catch (error) {
    console.error('Error fetching farmers:', error);
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
};

// Create order
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { crop, quantity } = req.body;
    const orderQty = parseFloat(quantity);

    // Get available listings for the crop
    const availableListings = await AggregatorListing.find({
      crop,
      status: 'listed'
    }).session(session);

    if (availableListings.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: `No available listings for ${crop}` 
      });
    }

    const totalAvailable = availableListings.reduce((sum, l) => sum + l.quantity, 0);
    
    if (orderQty > totalAvailable) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: `Not enough stock. Available: ${totalAvailable} kg` 
      });
    }

    const price = availableListings[0].price;
    const total_amount = orderQty * price;

    // Create order
    const order = new AggregatorOrder({
      crop,
      total_quantity: orderQty,
      price,
      total_amount
    });

    await order.save({ session });

    // Update listings
    let remainingQty = orderQty;
    const updatedListings = [];

    for (const listing of availableListings) {
      if (remainingQty <= 0) break;

      const sellQty = Math.min(listing.quantity, remainingQty);
      remainingQty -= sellQty;

      const newQuantity = listing.quantity - sellQty;
      const status = newQuantity === 0 ? 'sold' : 'listed';

      const updatedListing = await AggregatorListing.findByIdAndUpdate(
        listing._id,
        { 
          quantity: newQuantity, 
          status,
          soldInThisOrder: sellQty 
        },
        { new: true, session }
      );

      updatedListings.push(updatedListing);
    }

    await session.commitTransaction();
    
    res.json({
      success: true,
      order,
      updatedListings
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    session.endSession();
  }
};

// Get all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await AggregatorOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔧 UPDATE ORDER REQUEST:', { id, status });

    // Validate order ID
    if (!id || id === 'undefined') {
      console.log('❌ Invalid order ID received');
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid MongoDB ID format:', id);
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    console.log('🔍 Searching for order with ID:', id);
    const order = await AggregatorOrder.findById(id);
    console.log('🔍 Found order:', order);

    if (!order) {
      console.log('❌ Order not found with ID:', id);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update the order
    order.status = status;
    await order.save();

    console.log('✅ Order updated successfully:', order);
    
    res.json({ 
      success: true, 
      message: 'Order status updated successfully',
      order 
    });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({ 
      error: 'Failed to update order: ' + error.message 
    });
  }
};

// Log collection
export const logCollection = async (req, res) => {
  try {
    const { farmerId, quantity } = req.body;

    // Verify farmer exists
    const farmer = await AggregatorFarmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    const collection = new AggregatorCollection({
      farmer_id: farmerId,
      quantity: parseFloat(quantity)
    });

    await collection.save();
    
    res.json({ 
      success: true, 
      message: 'Collection logged successfully',
      collection 
    });
  } catch (error) {
    console.error('Error logging collection:', error);
    res.status(500).json({ error: 'Failed to log collection' });
  }
};

// Get collections (optional)
export const getCollections = async (req, res) => {
  try {
    const collections = await AggregatorCollection.find()
      .populate('farmer_id', 'name phone')
      .sort({ createdAt: -1 });
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};