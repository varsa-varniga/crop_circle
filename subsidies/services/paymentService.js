// services/paymentService.js
const Razorpay = require('razorpay');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  
  static async disburseLoan(applicationId, amount, bankAccount) {
    try {
      const payout = await this.razorpay.payouts.create({
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account_id: bankAccount.fundAccountId,
        amount: amount * 100, // in paise
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout'
      });
      
      // Update application with transaction details
      await Application.findByIdAndUpdate(applicationId, {
        status: 'disbursed',
        disbursedAt: new Date(),
        disbursementAmount: amount,
        transactionId: payout.id
      });
      
      return payout;
    } catch (error) {
      throw new Error(`Payout failed: ${error.message}`);
    }
  }
}