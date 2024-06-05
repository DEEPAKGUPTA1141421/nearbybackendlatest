const customError = require("../middleware/customError");
const razorpay = require("razorpay");
const dotenv = require("dotenv");
const Payment = require("../models/payment");
const crypto = require("crypto");
const { createOrder } = require("./orderController");
dotenv.config();

const instance = new razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

module.exports.checkout = async (req, res, next) => {
  const options = {
    amount: Number(req.body.amount * 100), // it is written smallest currency unit which is paise
    currency: "INR",
  };

  try {
    const order = await instance.orders.create(options);
    console.log(order);
    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    next(new customError("Not able to create order", 400));
  }
};

module.exports.paymentVerification = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
    .update(body.toString())
    .digest("hex");

  console.log(expectedSignature);

  if (expectedSignature === razorpay_signature) {
    const payment = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    };
    res.redirect(
      `/paymentsuccess?reference=${razorpay_payment_id}`
    );
  } else {
    res.status(400).json({
      success: false,
    });
  }
};
module.exports.getkey=async (req, res) =>{
  try{
    res.status(200).json({ key: process.env.RAZORPAY_API_KEY });
  }
  catch(err){
    next(new customError(err.message));
  }
}
module.exports.savePaymentToDb=async(req,res,next)=>{
  try{
    const payment=await Payment.create(req.body);
    if(payment){
      res.status(200).json({
        message:"Payment Saved",
        success:true,
        payment:payment
      })
    }
    else{
      next(new customError("Payment Not Saved",501));
    }
  }
  catch(err){
    next(new customError(err.message,404));
  }
}