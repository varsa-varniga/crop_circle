import mongoose from 'mongoose';

// Farmer Schema
const farmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true }
}, { timestamps: true });

// Listing Schema
const listingSchema = new mongoose.Schema({
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AggregatorFarmer', required: true },
  farmer_name: { type: String, required: true },
  crop: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['listed', 'sold'], default: 'listed' },
  originalQuantity: { type: Number, required: true },
  soldInThisOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Order Schema (renamed to avoid conflict)
const aggregatorOrderSchema = new mongoose.Schema({
  crop: { type: String, required: true },
  total_quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
}, { timestamps: true });

// Collection Schema
const collectionSchema = new mongoose.Schema({
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AggregatorFarmer', required: true },
  quantity: { type: Number, required: true }
}, { timestamps: true });

// Create models with unique names
const AggregatorFarmer = mongoose.model('AggregatorFarmer', farmerSchema);
const AggregatorListing = mongoose.model('AggregatorListing', listingSchema);
const AggregatorOrder = mongoose.model('AggregatorOrder', aggregatorOrderSchema);
const AggregatorCollection = mongoose.model('AggregatorCollection', collectionSchema);

export { AggregatorFarmer, AggregatorListing, AggregatorOrder, AggregatorCollection };