const customError = require("../middleware/customError");
const Shop = require("../models/shop");
const Track = require("../models/tracking");
const Order = require("../models/order");
const Product=require("../models/product");
const customResponse = (message, success, res) => {
  res.status(400).json({
    success: success,
    message: message,
  });
};
module.exports.gettopshop=async(req,res,next)=>{
  try{
    const shop=await Shop.find({}).limit(5);
    if(!shop){
      next(new customError("shop not found",404));
    }
    else{
      res.status(200).json({
        success:true,
        message:"get top shop",
        shop:shop
      })
    }
  }
  catch(err){
    next(new customError("shop not found",404));
  }
}

module.exports.createShop = async (req, res, next) => {
  let data = req.body;
  const user=req.user._id;
  console.log(req.body);
  try {
    const shop = await Shop.findOne({ email:req.body.email });

    if (shop) {
      customResponse("Shop already exists", false, res);
    } else {
      console.log(req.body.shopname)
      const shopCreated = await Shop.create({
        shopname: req.body.shopname,
        ownername: req.body.ownername,
        email: req.body.email,
        contactNumber: req.body.contactNumber,
        aadharCard: req.body.aadharCard,
        address: {
            state: req.body.state,
            city: req.body.city,
            district: req.body.district,
            postalCode: req.body.postalCode
        },
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        category: req.body.category,
        location: req.body.location,
        user:user
    });
      res.status(200).json({
        success: true,
        message: "Shop created successfully",
        shopCreated,
      });
    }
  } catch (err) {
    next(new customError(err.message, 404));
  }
};
module.exports.getshopInfo = async (req, res, next) => {
  const id = req.user._id;
  console.log(id);
  try {
    const shop = await Shop.find({user:id});
    if (!shop) {
      customResponse("shop Not Found", false, res);
    } else {
      res.status(200).json({
        success: true,
        message: "shop Found Succesfully",
        shop: shop,
      });
    }
  } catch (err) {
    next(new customError(err.message, 404));
  }
};

module.exports.updateShopInfo = async (req, res, next) => {
  console.log("inside updateShopInfo");
  try {
    const id = req.params.id;
    const data = req.body;
    const { postalCode, state, district, city } = data;
    data.address = { state, city, district, postalCode };
    console.log("data is ", data);
    const updateshop = await Shop.findByIdAndUpdate(id, data, { new: true });
    if (!updateshop) {
      customResponse("Update Product Failed", 400, res);
    } else {
      res.status(200).json({
        success: true,
        message: "shop Updated Succesful",
        shop: updateshop,
      });
    }
  } catch (error) {
    next(customError(error.message, 500));
  }
};

module.exports.getAllProduct = async (req, res, next) => {
  try {
      const id = req.user._id;
    //  const {id}=req.params;
    console.log("id",id);
    const queryobj = req.query;
    console.log(queryobj);
    const query = {};
    const sortingObj = {};
    if (queryobj.subcategory) {
      query.subcategory = queryobj.subcategory;
    }
    if (queryobj.category) {
      query.category = queryobj.category;
    }
    if (queryobj.rating) {
      query.rating = { $gte: parseFloat(queryobj.rating) };
    }
    if (queryobj.from && queryobj.to) {
      query.price = {
        $lte: parseFloat(queryobj.to),
        $gte: parseFloat(queryobj.from),
      };
    } else if (queryobj.from) {
      query.price = { $gte: parseFloat(queryobj.from) };
    } else if (queryobj.to) {
      query.price = { $lte: parseFloat(queryobj.to) };
    }
    if (queryobj.sortOnsellingPrice) {
      sortingObj.sellingPrice = queryobj.sortOnsellingPrice === "asc" ? 1 : -1;
    }
    if (queryobj.sortOnrating) {
      sortingObj.rating = queryobj.sortOnrating === "asc" ? 1 : -1;
    }
    const shopId = await Shop.findOne({user:id}).populate("productId").exec();
    console.log("shop",shopId);
    const productIds = shopId.productId.map((product) => product._id);
    const productToReturn = await Product.find({
      _id: { $in: productIds},
      ...query,
    }).sort({ ...sortingObj });
    console.log("productsIds",productIds);
    res.status(200).json({
      count:productToReturn.length,
      success: true,
      message: "get all Product Of Shop",
      productToReturn: productToReturn,
    });
  } catch (err) {
    next(new customError(err.message, 404));
  }
};

module.exports.ordersPlaced = async (req, res, next) => {
  let shopId = req.params.id;
  try {
    const orders = await Order.find()
      .populate({ path: "orderItems.product" })
      .exec();

    const matchedProducts = [];
    for (let i = 0; i < orders.length; i++) {
      const orderItems = orders[i].orderItems;
      for (let j = 0; j < orderItems.length; j++) {
        if (orderItems[j].product.shopId.toString() === shopId) {
          matchedProducts.push(orderItems[j]);
        }
      }
    }

    if (matchedProducts.length == 0) {
      next(new customError("No order placed from your shop", 400));
    } else {
      res.status(200).json({
        success: true,
        matchedProducts,
      });
    }
  } catch (err) {
    next(
      new customError("Not able to fetch orders placed from your shop", 400)
    );
  }
};

module.exports.createOtp = async (req, res, next) => {
  const id = req.params.id;
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const trackId = await Track.findById(id);
    trackId.sellerotp = otp;
    trackId.sellerotpExpires = Date.now() + 5 * 60 * 1000;
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

module.exports.getAllOrderOfShop = async (req, res, next) => {
  try {
    const shopId = req.params.shopid;
    const order = await Order.find({}) // Find all orders
      .populate({
        path: "orderItems.product",
      })
      .exec();
    if (!order) {
      next(new customError("No Order Is Found For this shop", 501));
    } else {
      const matchedProducts = order.flatMap((orders) =>
        orders.orderItems.filter(
          (item) => item.product.shopId.toString() === shopId
        )
      );
      if (matchedProducts.length == 0) {
        next(new customError("No orders placed currently from your shop", 400));
      } else {
        res.status(200).json({
          success: true,
          message: "All the Orders",
          order: matchedProducts,
        });
      }
    }
  } catch (err) {
    next(new customError(err.message, 403));
  }
};
module.exports.bestshop=async(req,res,next)=>{
  try{
    const order=await Order.find().populate("orderItems.product").exec();
    const shopMap = new Map();
    console.log(order[0].orderItems[0].name);
    for(let i=0;i<order.length;i++){
      console.log(i);
      for(let j=0;j<order[i].orderItems[j].length;j++){
        if(shopMap.has(order[i].orderItems[j].product.shopId)){
          console.log(1);
          shopMap.set(order[i].orderItems[j].product.shopId,shopMap.get(order[i].orderItems[j].product.shopId)+1);
        }
        else{
          shopMap.set(order[i].orderItems[j].product.shopId,1);
        }
      }
    }
    const pairsArray = [];
    const countorder=[];
    for (const [shopId, value] of shopMap.entries()) {
        console.log(shopId,value);
        pairsArray.push([value, shopId]);
    }

   pairsArray.sort((a, b) => b[0] - a[0]);
   for(let i=0;i<pairsArray.length&&i<=10;i++){
       const shop=await Shop.findById(pairsArray[i][1]);
       countorder.push([shop,pairsArray[i][0]]);
   }
    res.status(200).json({
      success:true,
      order:order,
      countorder:countorder
    })
   }
  catch(err){
    next(new customError(err.message,404));
  }
}
module.exports.getAllProductForUser=async(req,res,next)=>{
  try {
  const {id}=req.params;
  console.log("id",id);
  const queryobj = req.query;
  console.log(queryobj);
  const query = {};
  const sortingObj = {};
  if (queryobj.subcategory) {
    query.subcategory = queryobj.subcategory;
  }
  if (queryobj.category) {
    query.category = queryobj.category;
  }
  if (queryobj.rating) {
    query.rating = { $gte: parseFloat(queryobj.rating) };
  }
  if (queryobj.from && queryobj.to) {
    query.price = {
      $lte: parseFloat(queryobj.to),
      $gte: parseFloat(queryobj.from),
    };
  } else if (queryobj.from) {
    query.price = { $gte: parseFloat(queryobj.from) };
  } else if (queryobj.to) {
    query.price = { $lte: parseFloat(queryobj.to) };
  }
  if (queryobj.sortOnsellingPrice) {
    sortingObj.sellingPrice = queryobj.sortOnsellingPrice === "asc" ? 1 : -1;
  }
  if (queryobj.sortOnrating) {
    sortingObj.rating = queryobj.sortOnrating === "asc" ? 1 : -1;
  }
  const shopId = await Shop.findById(id).populate("productId").exec();
  console.log("shop",shopId);
  const productIds = shopId.productId.map((product) => product._id);
  const productToReturn = await Product.find({
    _id: { $in: productIds},
    ...query,
  }).sort({ ...sortingObj });
  console.log("productsIds",productIds);
  res.status(200).json({
    count:productToReturn.length,
    success: true,
    message: "get all Product Of Shop",
    productToReturn: productToReturn,
    nameofShop:shopId.shopname
  });
} catch (err) {
  next(new customError(err.message, 404));
}
}
module.exports.getAllShopOfCity=async(req,res,next)=>{
  const {city}=req.params;
  console.log("city",city);
  try{
    const shoplist = await Shop.find({ location: { $regex: new RegExp(city, 'i') } });
    console.log(shoplist);
    if(shoplist){
      res.status(200).json({
        message:"Get All The Shop",
        shoplist:shoplist,
        success:true
      })
    }
  }
  catch(err){
    next(new customError(err.message,404));
  }
}