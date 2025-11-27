import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  image: { type: String, required: true }
});

const shippingInfoSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true }
});

const paymentInfoSchema = new mongoose.Schema({
  nameOnCard: { type: String, required: true, trim: true },
  cardNumber: { type: String, required: true },
  expiry: { type: String, required: true },
  cvv: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, default: 'guest' },
  userEmail: { type: String, required: true },
  userPhone: { type: String, required: true },
  items: [orderItemSchema],
  shippingInfo: shippingInfoSchema,
  paymentInfo: paymentInfoSchema,
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  shippingCost: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: () => `AGR${Date.now()}${Math.floor(Math.random() * 1000)}`
  },
  shippingMethod: {
    type: String,
    enum: ['standard', 'express'],
    default: 'standard'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: { type: Date }
}, {
  timestamps: true
});

orderSchema.pre('save', function(next) {
  if (!this.expectedDelivery) {
    const deliveryDate = new Date();
    const days = this.shippingMethod === 'standard' ? 5 : 2;
    deliveryDate.setDate(deliveryDate.getDate() + days);
    this.expectedDelivery = deliveryDate;
  }
  
  if (this.paymentInfo && this.paymentInfo.cardNumber) {
    const cardNumber = this.paymentInfo.cardNumber.replace(/\s/g, '');
    if (cardNumber.length >= 4 && !cardNumber.startsWith('****')) {
      this.paymentInfo.cardNumber = `**** **** **** ${cardNumber.slice(-4)}`;
    }
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;