const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema({
  razorpay_order_id: {
    type: String,
    required: true,
  },
  razorpay_payment_id: {
    type: String,
    required: true,
  },
  razorpay_signature: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  orderId: {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
  },
  trackingId: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Track",
    },
  ],
});

module.exports = mongoose.model("Payment", paymentSchema);
