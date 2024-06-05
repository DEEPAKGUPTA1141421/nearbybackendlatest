const mongoose = require("mongoose");

const product = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    actualPrice: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    stock: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
    },
    totalRating: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
      },
    ],
    rating:[
      {
        user:{
          type:mongoose.Schema.ObjectId,
          ref:"User"
        },
        singleRating:{
          type:Number
        }
      }
    ],
    totalRating:{
      type:Number,
      default:0
    },
    category: {
      type: String,
      required: true,
    },
    genderSpecific:{
      type:String,
      default:"Neutral"
    },
    shopId: {
      type: mongoose.Schema.ObjectId,
      ref: "Shop",
    },
  },
  { timestamps:true}
);
module.exports=mongoose.model("Product", product);