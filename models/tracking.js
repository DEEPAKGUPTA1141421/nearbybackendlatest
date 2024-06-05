const mongoose = require("mongoose");

const trackingSchema = mongoose.Schema(
  {
    productId:{
        type:mongoose.Schema.ObjectId,
        ref:"Product"
    },
    riderId:{
        type:mongoose.Schema.ObjectId,
        ref:"Rider"
    },
    status:{
        type:String,
        required:true
    },
    sellerotp:{
      type:String
    },
    sellerotpExpires:{
      type:Date
    },
    userotp:{
      type:String,
    }
    ,userotpExpires:{
      type:Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Track", trackingSchema);