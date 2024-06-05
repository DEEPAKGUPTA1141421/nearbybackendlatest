const customError = require("../middleware/customError");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendMail");
const Product = require("../models/product");
const Track = require("../models/tracking");
const Order=require("../models/order");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const sendToken = async (user, statusCode, message, res) => {
  const token = user.getToken();
  console.log("hello",token);
  // options for cookies
  //const COOKIES_EXPIRES=Number
  console.log("token",token);
  res.cookie("token", token, {
    expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in milliseconds
    httpOnly: true,
  });
  return res.status(statusCode).json({
    user: user,
    message: message,
    success: true,
  });
};
module.exports.loaduser=async(req,res,next)=>{
  try{
    const u=req.user;
    if(u){
      res.status(200).json({
        success:true,
        message:"user Loaded",
        user:u
      })
    }
    else{
      next(new customError("user not found",404));
    }
  }
  catch(err){
    next(new customError(err.message,404));
  }
}
module.exports.test=async(req,res,next)=>{
    console.log(req.body.test);
    res.status(200).json({
        success:true
    })
}
module.exports.createuserfornow=async(req,res,next)=>{
  try {
    console.log("inside");
    // Extract fields from the request body
    const { fullname, email, password, image, role } = req.body;
    const { country, city, address1, address2, postalCode, addressType } = req.body;

    // Parse address field as an object
    const address = {
      country,
      city,
      address1,
      address2,
      postalCode,
      addressType
    };

    // Create a new user document using the UserModel
    console.log("2");
    const user = await User.create({
      fullname,
      email,
      password,
      image,
      address, 
    });

    if (user) {
      // If user is created successfully, send token
      sendToken(user, 201, "User Created Successfully", res);
    } else {
      // If user creation failed (unlikely with unique email constraint), throw an error
      next(new customError("Email Already Exists", 404));
    }
  } catch (err) {
    // Handle any errors that occur during user creation
    next(new customError(err.message, 404));
  }
}
module.exports.signup = async (req, res, next) => {
  console.log("inside signup");
  const { name, email, password } = req.body;

  try {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    console.log("inside controller");
    console.log(name, email, password);

    const user = await User.findOne({ email: email });

    if (user) {
      throw new customError("User Already Exists", 400); // Throw error instead of using next()
    }

    const newUserToBeCreated = {
      fullname: name,
      email: email,
      password: password,
      image: myCloud.url, // Accessing the URL property of myCloud directly
    };

    const activationToken = createActivationToken(newUserToBeCreated);

    const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    console.log(newUserToBeCreated.email);

    await sendEmail({
      email: newUserToBeCreated.email,
      subject: "Activate Your Account",
      message: `Hello ${newUserToBeCreated.fullname} Please Click To Activate On The Link For Your Account: ${activationUrl}`,
    });

    res.status(200).json({
      success: true,
      user: "user needs to br crested",
      message: "email sent",
    });
  } catch (err) {
    next(new customError(err.message, err.statusCode || 500)); // Pass the status code if available
  }
};
module.exports.createActualUser = async (req, res, next) => {
  console.log("called Actual");
  const { activationToken } = req.body;
  console.log("activationToken", activationToken);
  const newuser = await jwt.verify(
    activationToken,
    process.env.jwtActivationSecret
  );
  console.log(newuser);
  const { id } = newuser;
  if (!newuser) {
    next(new customError("ToKen Expired", 400));
  }
  try {
    const u = await User.create(id);
    sendToken(u, 201, "User Created Succesfully", res);
  } catch (err) {
    next(new customError(err.message, 500));
  }
};

const createActivationToken = (user) => {
  return jwt.sign({ id: user }, process.env.jwtActivationSecret, {
    expiresIn: "5m",
  });
};

module.exports.login = async (req, res, next) => {
  let data = req.body;
  const { email, password } = data;
  console.log({email,password});
  const user = await User.findOne({ email: email }).select("+password");
  // console.log(user);
  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
  } else {
    try {
      console.log("1");
      const passMatch = await user.checkPassword(password);
      console.log("2");
      if (!passMatch) {
        res.status(401).json({
          success: false,
          message: "Unauthorized user",
        });
      } else {
        sendToken(user, 201, "Login Succesful", res);
      }
    } catch (err){
      console.log("sere");
      next(new customError(err.message, 400));
    }
  }
};

module.exports.getUser = async (req, res, next) => {
  let id = req.params.id;
  try {
    const user = await User.findById(id);
    if (user) {
      res.status(200).json({
        success: true,
        message: "user found",
        user,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
  } catch (err) {
    next(new customError(err));
  }
};

module.exports.updateUser = async (req, res, next) => {
  const id = req.params.id;
  const data = req.body;
  console.log("body",req.body);
  try {
    const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
    console.log(updatedUser);
    if (updatedUser) {
      res.status(200).json({
        success: true,
        message: "user updated successfully",
        updatedUser,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "failed to update user",
      });
    }
  } catch (err) {
    next(new customError(err));
  }
};

module.exports.deleteUser = async (req, res, next) => {
  const id = req.params.id;

  try {
    const deletecheck = await User.findByIdAndDelete(id);
    if (deletecheck) {
      res.status(200).json({
        success: true,
        message: "user deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "failed to delete user",
      });
    }
  } catch (err) {
    next(new customError(err));
  }
};

module.exports.orders = async (req, res, next) => {
  try {
    const id = req.user._id;
    const order=await Order.find({user:id});
    if(!order){
      next(new customError("no product of this user"),501);
    }
    else{
      res.status(200).json({
        success:true,
        message:"ALL ORDER OF LOGIN USER",
        order:order
      })
    }
    // const user = await User.findById(id)
    //   .populate({
    //     path: "order",
    //     populate: {
    //       path: "orderId", // Populate the product field in orderItems
    //     },
    //   })
    //   .exec();
    // console.log(user);  
    // if (!user) {
    //   next(new customError("orders for this user is not found", 404))
    //     .populate("order")
    //     .exec();
    // } else {
    //   res.status(200).json({
    //     success: true,
    //     message: "All Orders Received at dashboard",
    //     order: user.order,
    //   });
  } catch (err) {
    next(new customError(err.message, 501));
  }
};

module.exports.addToCart = async (req, res, next) => {
  let id = req.params.id;
  id = new ObjectId(id);
  console.log(typeof(id));
  console.log(req.user._id);
  let userId = req.user._id;
  console.log(id, userId);
  try {
    console.log("1");
    const user = await User.findById(userId);
    console.log("2");
    if (!user) {
      next(new customError("User not found", 400));
    console.log("3");
    } else {
    console.log("4");
      for(let i=0;i<user.cart.length;i++){
        console.log(user.cart[i],id);
        if(user.cart[i].productId.equals(id)){
          console.log("inside");
          next(new customError("Item Already in  cart", 400));
        }
      }
      user.cart.push({ productId: id });
      console.log("5");
      await user.save();
      console.log("6");
      res.status(200).json({
        success: true,
        message: "Added to cart",
        user,
      });
    }
  } catch (err) {
    console.log(err);
    next(new customError("product not added to cart", 400));
  }
};

module.exports.addToWishlist = async (req, res, next) => {
  let id = req.params.id;
  id = new ObjectId(id);
  let userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      next(new customError("User not found", 400));
    } else {
      for(let i=0;i<user.wishlist.length;i++){
        console.log(user.wishlist[i],id);
        if(user.wishlist[i].productId.equals(id)){
          console.log("inside");
          next(new customError("Item Already in  cart", 400));
        }
      }
      user.wishlist.push({ productId: id });
      await user.save();
      res.status(200).json({
        success: true,
        message: "Added to wishlist",
        user,
      });
    }
  } catch (err) {
    next(new customError("product not added to cart", 400));
  }
};

module.exports.wishlistToCart = async (req, res, next) => {
  let id = req.params.id;
  id=new ObjectId(id);
  let userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      next(new customError("User not found", 400));
    } else {
      const wishlist = user.wishlist.filter(
        (item) => item.productId.toString() != id
      );
      console.log(wishlist);
      user.wishlist = wishlist;
      user.cart.push({ productId: id });
      await user.save();

      res.status(200).json({
        success: true,
        message: "Item moved from wishlist to cart",
        user,
      });
    }
  } catch (err) {
    next(new customError("Unable to move item from wishlist to cart", 400));
  }
};
module.exports.cartToWishlist = async (req, res, next) => {
  let id = req.params.id;
  let userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      next(new customError("User not found", 400));
    } else {
      const cartlist = user.cart.filter(
        (item) => item.productId.toString() != id
      );
      console.log(cartlist);
      user.cart = cartlist;
      user.wishlist.push({ productId: id });
      await user.save();

      res.status(200).json({
        success: true,
        message: "Item moved from  cart to wishlist",
        user,
      });
    }
  } catch (err) {
    next(new customError("Unable to move item from wishlist to cart", 400));
  }
};
module.exports.createOtp = async (req, res, next) => {
  const id = req.params.id;
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const trackId = await Track.findById(id);
    trackId.userotp = otp;
    trackId.userotpExpires = Date.now() + 5 * 60 * 1000;
    await trackId.save();
    res.status(200).json({
      success: true,
      message: "OTP Sent Successfully",
      trackId: trackId,
    });
  } catch (err) {
    next(new customError(err.message, 500));
  }
};

module.exports.addComment = async (req, res, next) => {
  try {
    const id = req.params.id;
    //const {userid}=req.body;
    const product = await Product.findById(id);
    product.reviews.unshift(req.body);
    await product.save();
    if (!product) {
      next(new customError("product is not defined", 501));
    } else {
      res.status(200).json({
        success: true,
        message: "comment successfully",
        product: product,
      });
    }
  } catch (err) {
    next(new customError(err.message, 404));
  }
};

module.exports.cartItems = async (req, res, next) => {
  let userId = req.user._id;
  console.log("hello",userId);
  try {
    const user = await User.findById(userId)
      .populate({ path: "cart.productId" })
      .exec();
    console.log(user);
    const cartItems = user.cart;

    if (cartItems) {
      res.status(200).json({
        success: true,
        cartItems,
      });
    } else {
      res.status(200).json({
        success: false,
        message: "No items in cart",
      });
    }
  } catch (err) {
    next(new customError("Not able to fetch user cart items", 400));
  }
};
module.exports.wishlistItems=async(req,res,next)=>{
  let userId = req.params.id;
  console.log("hello",userId);
  try {
    const user = await User.findById(userId)
      .populate({ path: "wishlist.productId" })
      .exec();
    console.log(user);
    const wishItems = user.wishlist;
    if (wishItems) {
      res.status(200).json({
        success: true,
        wishItems
      });
    } else {
      res.status(200).json({
        success: false,
        message: "No items in widhlist",
      });
    }
  } catch (err) {
    next(new customError("Not able to fetch user wishlist items", 400));
  }
}
module.exports.removeItemFromWishlist = async (req, res, next) => {
  let userId = req.user._id;
  let productId = req.params.id;
  productId=new ObjectId(productId);
  console.log(userId, productId);

  try {
    const user = await User.findById(userId);
    console.log("user is", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.updateOne({ $pull: { wishlist: { productId: productId } } });

    const updatedUser = await User.findById(userId);
    const wishlistItems = updatedUser.wishlist || [];

    res.status(200).json({
      success: true,
      wishlistItems,
    });
  } catch (err) {
    next(new customError("Not able to fetch user wishlist items", 400));
  }
};
module.exports.removeItemFromCart = async (req, res, next) => {
  let userId = req.user._id;
  let productId = req.params.id;
  console.log(userId, productId);

  try {
    const user = await User.findById(userId);
    console.log("user is", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.updateOne({ $pull: { cart: { productId: productId } } });

    const updatedUser = await User.findById(userId);
    const cartItems = updatedUser.cart || [];

    res.status(200).json({
      success: true,
      cartItems,
    });
  } catch (err) {
    next(new customError("Not able to fetch user cart items", 400));
  }
};
module.exports.logout = async (req, res, next) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "cookie deleted",
    });
  } catch (err) {
    next(new customError("unable to logout", 500));
  }
};
module.exports.clearCart = async (req, res, next) => {
  let userId = req.user._id;
  try {
    const user = await User.findById(userId);

    if (!user) {
      next(new customError("Cart Not Cleared User Not Found",404));
    }
    else{
      user.cart = []; // Clear the cart array

    await user.save(); // Save the updated user object

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
    }
  } catch (err) {
    // Handle errors
    next(new customError('Not able to clear user cart', 400));
  }
};