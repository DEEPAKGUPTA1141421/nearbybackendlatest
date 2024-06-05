const customError = require("../middleware/customError");
const Product = require("../models/product");
const Track = require("../models/tracking");
const Order = require("../models/order");
const Shop = require("../models/shop");
const { createOtp } = require("./shopController");
module.exports.createOrder = async (req, res, next) => {
  console.log("deepak",req.body);
  req.body.user=req.user._id;
  req.body.orderItems=JSON.parse(req.body.orderItems);
  console.log("image",typeof(req.body.orderItems[0].image));
  console.log("image length",req.body.orderItems[0].image.length);
  console.log("length",req.body.orderItems.length);
  req.body.orderItems[0].image
  req.body.shippingInfo={contactNumber:req.body.contactNumber,address:req.body.address,
    state:req.body.state,country:req.body.country,postalCode:req.body.postalCode,city:req.body.city};
  console.log("ram",req.body.itemsPrice,
    req.body.taxPrice,
    req.body.shippingPrice,
    req.body.totalPrice);
  try {
    const orderCreated = await Order.create(req.body);
    if (!orderCreated) {
      next(new customError("Order not placed",400));
    } else {
      for (let i = 0; i < orderCreated.orderItems.length; i++) {
        let productId = orderCreated.orderItems[i].product;
        let quan = orderCreated.orderItems[i].Quantity;
        const trackingItem = await Track.create({
          productId,
          status: "processing",
        });

        orderCreated.orderItems[i].trackingId = trackingItem._id;
        await orderCreated.save();

        const product = await Product.findById(productId);
        // console.log(product);

        const shopId = product.shopId;
        const shop = await Shop.findById(shopId);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        console.log("current",currentMonth);
        console.log("shop",shop);
        console.log("typeof",shop.sellerTotalSellArray[currentMonth]);
        console.log("sum",parseInt(product.sellingPrice) +10,parseInt(quan)+90);
        console.log("type",(parseInt(product.sellingPrice) * parseInt(quan)));
        shop.sellerTotalSellArray[currentMonth] = shop.sellerTotalSellArray[currentMonth]+(parseFloat(product.sellingPrice) * parseFloat(quan));
        await shop.save();
        if (!product){
          next(new customError("Product not found",404));
          return;
        } else {
          let stock = product.stock;
          let newStock = stock - quan;
          await Product.findByIdAndUpdate(productId, {
            $set: { stock: newStock },
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Order placed successfully",
        orderCreated,
      });
    }
  } catch (err) {
    next(new customError(err.message, 404));
  }
};

module.exports.deleteOrder = async (req, res, next) => {
  const id = req.params.id;
  try {
    const getOrder = await Order.findById(id);
    if (getOrder.orderStatus === "processing") {
      const deleteStatus = await Order.findByIdAndDelete(id);
      if (!deleteStatus) {
        next(new customError("Unable to cancel order", 500));
      } else {
        for (let i = 0; i < getOrder.orderItems.length; i++) {
          let id = getOrder.orderItems[i].product;
          let quan = getOrder.orderItems[i].Quantity;
          console.log(id, quan);

          const product = await Product.findById(id);
          console.log(product);

          if (!product) {
            next(new customError("Product not found", 404));
            return;
          } else {
            let stock = product.stock;
            let newStock = stock + quan;
            await Product.findByIdAndUpdate(id, {
              $set: { stock: newStock },
            });
          }
        }

        res.status(200).json({
          success: true,
          message: "Order cancelled successfully",
        });
      }
    } else {
      next(new customError("Order cannot be cancelled now.", 500));
    }
  } catch (err) {
    next(new customError(err.message, 400));
  }
};

// module.exports.updateOrderStatus = async (req, res, next) => {
//   const id = req.params.id;
//   const orderstatus = req.body.orderStatus;
//   try {
//     const updatedOrder = await Order.findByIdAndUpdate(
//       id,
//       { $set: { orderStatus: orderstatus } },
//       { new: true }
//     );

//     if (!updatedOrder) {
//       next(new customError("Order status not updated", 400));
//     } else {
//       res.status(200).json({
//         succes: true,
//         message: "Order status updated succesfully",
//         updatedOrder,
//       });
//     }
//   } catch (err) {
//     next(new customError(err.message, 400));
//   }
// };
