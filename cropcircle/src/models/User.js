import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  quantity: Number,
  image: String
});

const orderSchema = new mongoose.Schema({
  orderId: String,
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: 'confirmed' },
  totalAmount: Number,
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    phone: String
  },
  paymentMethod: { type: String, default: 'Credit Card' },
  items: [orderItemSchema]
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  orders: [orderSchema]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;