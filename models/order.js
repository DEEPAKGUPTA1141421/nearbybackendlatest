const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      address: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
        default: "india",
      },
      postalCode: {
        type: Number,
      },
      contactNumber: {
        type: Number,
      },
    },
    orderItems: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        Quantity: {
          type: Number,
          required: true,
        },
        image: {
          type: Array,
          required: true,
        },
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
        trackingId: {
          type: mongoose.Schema.ObjectId,
          ref: "Track",
        },
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    paymentInfo: {
      id: {
        type: String,
      },
      status: {
        type: String,
        default: "pending",
      },
    },
    paidAt: {
      type: Date,
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: String,
      required: true,
      default: 0,
    },
    orderStatus: {
      type: String,
      default: "processing",
    },
    deliveredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);