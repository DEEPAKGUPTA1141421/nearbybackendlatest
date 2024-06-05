const mongoose = require("mongoose");

const shop = new mongoose.Schema(
  {
    user:{
      type:mongoose.Schema.ObjectId,
      ref:"User"
    },
    shopname: {
      type: String,
      required: true,
    },
    imageofshop:{
      type:String
    },
    ownername: {
      type: String,
      required: true,
    },
    location:{
      type:String
    },
    email: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    aadharCard: {
      type: String,
      required: true,
    },
    address: {
      state: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      district: {
        type: String,
        required: true,
      },
      postalCode: {
        type: Number,
        required: true,
      },
    },
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    productId: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    sellerTotalSellArray: {
      type: [Number],
      default: new Array(12).fill(0),
    },
    sellerTotalPaymentArray: {
      type:  [Number],
      default: new Array(12).fill(0),
    },
    sellerTotalRemainingArray: {
      type:  [Number],
      default: new Array(12).fill(0),
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Shop", shop);
