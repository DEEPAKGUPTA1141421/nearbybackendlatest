const customError = require("../middleware/customError");
const Rider = require("../models/rider");
const Track = require("../models/tracking");
const Product = require("../models/product");
const Shop = require("../models/shop");
const Payment = require("../models/payment");

module.exports.getAllProductsInProcessing = async (req, res, next) => {
  try {
    console.log(req.user);
    const processingOrders = await Track.find({ status: "processing" }).populate("productId").exec();
    if (processingOrders) {
      res.status(200).json({
        success: true,
        processingOrders,
      });
    } else {
      next(new customError("no products now", 400));
    }
  } catch (err){
    next(new customError("no products now", 400));
  }
};
module.exports.getinfopaymentrider=async(req,res,next)=>{
  try {
    // Find riders with remaining payments greater than 0 for any month
    const riders = await Rider.find({
        $or: [
            { 'riderTotalRemainingArray.0': { $gt: 0 } },
            { 'riderTotalRemainingArray.1': { $gt: 0 } },
            { 'riderTotalRemainingArray.2': { $gt: 0 } },
            { 'riderTotalRemainingArray.3': { $gt: 0 } },
            { 'riderTotalRemainingArray.4': { $gt: 0 } },
            { 'riderTotalRemainingArray.5': { $gt: 0 } },
            { 'riderTotalRemainingArray.6': { $gt: 0 } },
            { 'riderTotalRemainingArray.7': { $gt: 0 } },
            { 'riderTotalRemainingArray.8': { $gt: 0 } },
            { 'riderTotalRemainingArray.9': { $gt: 0 } },
            { 'riderTotalRemainingArray.10': { $gt: 0 } },
            { 'riderTotalRemainingArray.11': { $gt: 0 } }
        ]
    });

    // Calculate the total remaining amount for each rider
    // riders.forEach(rider =>{
    //     const totalRemaining = rider.riderTotalRemainingArray.reduce((acc, val) => acc + val, 0);
    //     console.log(`Total remaining amount for rider ${rider._id}: ${totalRemaining}`);
    // });

    res.status(200).json({
        success: true,
        rider: riders
    });
} catch (err) {
    next(new customError(err.message,404));
}
}

module.exports.getinfopaymentseller=async(req,res,next)=>{
  try {
    // Find riders with remaining payments greater than 0 for any month
    const sellers = await Shop.find({
        $or: [
            { 'sellerTotalRemainingArray.0': { $gt: 0 } },
            { 'sellerTotalRemainingArray.1': { $gt: 0 } },
            { 'sellerTotalRemainingArray.2': { $gt: 0 } },
            { 'sellerTotalRemainingArray.3': { $gt: 0 } },
            { 'sellerTotalRemainingArray.4': { $gt: 0 } },
            { 'sellerTotalRemainingArray.5': { $gt: 0 } },
            { 'sellerTotalRemainingArray.6': { $gt: 0 } },
            { 'sellerTotalRemainingArray.7': { $gt: 0 } },
            { 'sellerTotalRemainingArray.8': { $gt: 0 } },
            { 'sellerTotalRemainingArray.9': { $gt: 0 } },
            { 'sellerTotalRemainingArray.10': { $gt: 0 } },
            { 'sellerTotalRemainingArray.11': { $gt: 0 } }
        ]
    });

    // Calculate the total remaining amount for each rider
    // riders.forEach(rider =>{
    //     const totalRemaining = rider.riderTotalRemainingArray.reduce((acc, val) => acc + val, 0);
    //     console.log(`Total remaining amount for rider ${rider._id}: ${totalRemaining}`);
    // });

    res.status(200).json({
        success: true,
        seller: sellers
    });
} catch (err) {
    next(new customError(err.message,404));
}
}

////////////////////////////////////////PROBLEM(trackingId not storing in db)////////////////////////////////////////
module.exports.allocateOrders = async (req, res, next) => {
  console.log("called");
  let trackingId = req.params.trackingid;
  console.log(trackingId);
  try {
    const trackingItem = await Track.findById(trackingId)
      .populate({ path: "productId", populate: { path: "shopId" } })
      .exec();
    console.log(trackingItem);

    if (trackingItem) {
      const shopCity = trackingItem.productId.shopId.address.city;
      console.log(shopCity);

      try {
        const ridersInShopCity = await Rider.find({ city: shopCity }).sort({
          rating: -1,
          "completedOrder.length": -1,
        });

        console.log(ridersInShopCity);

        if (ridersInShopCity.length == 0) {
          next(new customError("no rider is available", 400));
        } else {
          const rider = ridersInShopCity[0];
          const riderId = rider._id;
          trackingItem.riderId = riderId;
          rider.allocatedOrder.push({ TrackId: trackingId });
          rider.riderTotalWageArray[1]+=80;
          rider.riderTotalRemainingArray[1]+=80;
          const riderName = rider.name;
          trackingItem.status = "picked up";
          await trackingItem.save();
          await rider.save();

          console.log(rider.allocatedOrder);
          console.log(trackingId, " has been handed over to ", riderName);

          res.status(200).json({
            success: true,
            message: "order has been allocated",
            trackingItem,
          });
        }
      } catch (err) {
        next(new customError(err.message, 404));
      }
    } else {
      next(new customError("Tracking id not found", 400));
    }
  } catch (err) {
    next(new customError("product not allocated", 400));
  }
};

module.exports.createPayment = async (req, res, next) => {
  let data = req.body;

  try {
    const payment = await Payment.create(data);

    if (payment) {
      res.status(200).json({
        success: true,
        message: "payment done",
        payment,
      });
    } else {
      next(new customError("payment unsuccessful", 500));
    }
  } catch (err) {
    next(new customError(err.message, 500));
  }
};

module.exports.paySeller = async (req, res, next) => {
  let shopId = req.body.shopId;
  let priceToBePaid = req.body.price;
  let moneyWithAdmin = req.body.adminMoney;
  if (moneyWithAdmin < priceToBePaid) {
    next(new customError("money is not sufficient", 400));
  } else {
    try {
      const shop = await Shop.findById(shopId);

      for (let i = 0; i < shop.sellerTotalRemainingArray.length; i++) {
        if (shop.sellerTotalRemainingArray[i] === 0) continue;
        if (shop.sellerTotalRemainingArray[i] <= priceToBePaid) {

          shop.sellerTotalPaymentArray[i] += shop.sellerTotalRemainingArray[i];
          priceToBePaid -= shop.sellerTotalPaymentArray[i];
          shop.sellerTotalRemainingArray[i] =
            shop.sellerTotalSellArray[i] - shop.sellerTotalPaymentArray[i];
          await shop.save();  

        } else if (priceToBePaid > 0) {

          shop.sellerTotalPaymentArray[i] += priceToBePaid;
          priceToBePaid = 0;
          shop.sellerTotalRemainingArray[i] =
            shop.sellerTotalSellArray[i] - shop.sellerTotalPaymentArray[i];
            await shop.save();  
        } else {
          break;
        }
      }
      res.status(200).json({
        success:true,
        message:"payment done",
        shop:shop
      })
    } catch (err) {
      next(new customError(err.message, 400));
    }
  }
};

module.exports.payRider = async (req, res, next) => {
  let riderId = req.body.riderId;
  let priceToBePaid = req.body.price;
  let moneyWithAdmin = req.body.adminMoney;
  if (moneyWithAdmin < priceToBePaid){
    next(new customError("money is not sufficient", 400));
  } else {
    try {
      const rider = await Rider.findById(riderId);

      for (let i = 0; i < rider.riderTotalRemainingArray.length; i++) {
        if (rider.riderTotalRemainingArray[i] === 0) continue;
        if (rider.riderTotalRemainingArray[i] <= priceToBePaid) {
          rider.riderTotalPaymentArray[i] += rider.riderTotalRemainingArray[i];
          priceToBePaid -= rider.riderTotalPaymentArray[i];
          rider.riderTotalRemainingArray[i] =
            rider.riderTotalWageArray[i] - rider.riderTotalPaymentArray[i];
            await rider.save();
        } else if (priceToBePaid > 0) {
          rider.riderTotalPaymentArray[i] += priceToBePaid;
          priceToBePaid = 0;
          rider.riderTotalRemainingArray[i] =
            rider.riderTotalWageArray[i] - rider.riderTotalPaymentArray[i];
            await rider.save();
        } else {
          break;
        }
      }
      res.status(200).json({
        success:true,
        message:"payment done",
        rider:rider
      })
    } catch (err) {
      next(new customError(err.message, 400));
    }
  }
};
