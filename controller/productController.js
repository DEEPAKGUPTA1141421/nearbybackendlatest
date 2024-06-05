const customError = require("../middleware/customError");
const Product = require("../models/product");
const Shop = require("../models/shop");
const cloudinary=require("cloudinary");
const customResponse = (message, success, res) => {
  res.status(400).json({
    success: success,
    message: message,
  });
};

module.exports.createProduct = async (req, res, next) => {
  console.log("inside product");
  let data = req.body;
  // const uploadOptions={
  //   use_filename:true,
  //   public_id:"optional"
  // }
  const uploadedImages = req.body.images;
  // const files = req.files.images;
  // for (let i = 0; i < files.length; i++) {
  //   try{
  //     const result = await cloudinary.v2.uploader.upload(files[i].path, {
  //       folder: "avatars",
  //     });
  
  //     uploadedImages.push({
  //       public_id: result.public_id,
  //       url: result.secure_url,
  //     });
  //   }
  //   catch(err){
  //     next(new customError(err.message,404));
  //   }
  // }
  const {shopId}=req.params;
  const {
    name,
    description,
    actualPrice,
    discountPrice,
    sellingPrice,
    stock,
    category,
    genderspecific,
  } = data;
  // console.log(data);

  try {
    const productCreated = await Product.create({
      name,
      description,
      actualPrice,
      discountPrice,
      sellingPrice,
      stock,
      shopId,
      category,
      genderSpecific: genderspecific,
      images:uploadedImages
    });

    const s = await Shop.findById(shopId);
    // console.log(s);
    if (!s) {
      next(new customError("Shop Not Found"), 404);
    }
    else{
      s.productId.push(productCreated.id);
    await s.save();
    console.log("sucess");
    res.status(200).json({
      success: true,
      message: "Product created successfully",
      productCreated: productCreated,
    });
    }
  } catch (err) {
    next(new customError(err.message, 400));
  }
};

module.exports.getProduct = async (req, res, next) => {
  let productId = req.params.id;

  try {
    const product = await Product.findById(productId).populate("shopId").exec();
    if (product) {
      res.status(200).json({
        success: true,
        message: "Product found",
        product,
      });
    } else {
      customResponse("Product not found", false, res);
    }
  } catch (err) {
    next(new customError(err));
  }
};

module.exports.updateProduct = async (req, res, next) => {
  const productId = req.params.id;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true }
    );

    console.log(updatedProduct);

    if (updatedProduct) {
      res.status(200).json({
        success: true,
        message: "Product updated successfully",
      });
    } else {
      customResponse("Failed to update product", false, res);
    }
  } catch (err) {
    next(new customError(err));
  }
};

module.exports.deleteProduct = async (req, res, next) => {
  let productId = req.params.id;

  try {
    const productDeleted = await Product.findByIdAndDelete(productId);
    if (productDeleted) {
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } else {
      customResponse("Failed to delete product", false, res);
    }
  } catch (err) {
    next(new customError(err));
  }
};

module.exports.searchProducts = async (req, res, next) => {
  try {
    console.log("checking params",req.query);
    let filterQuery = {};
    let searchTerm = req.query.searchTerm || "";
    console.log(searchTerm);

    if (searchTerm) {
      filterQuery.name = {
        $regex: searchTerm,
        $options: "i", // case-insensitive search
      };
    }
    if(req.query.category){
      filterQuery.category= {
        $regex: req.query.category,
        $options: "i", // case-insensitive search
      };
    }
    if (req.query.from && req.query.to) {
      filterQuery.sellingPrice = {
        $gte: parseFloat(req.query.from),
        $lte: parseFloat(req.query.to),
      };
    }
    let boollimit=false;
    let products;
    if(req.query.limitproduct){
      boollimit=true;
    }
    if(boollimit){
      products=await Product.find(filterQuery).limit(req.query.limitproduct);
    }
    else{
      products = await Product.find(filterQuery);
    }

    if (req.query.latest) {
      products.sort((a, b) => b.createdAt - a.createdAt);
    }

    if (req.query.asc) {
      products.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (req.query.desc) {
      products.sort((a, b) => b.sellingPrice - a.sellingPrice);
    }

    if (req.query.rating) {
      products.sort((a, b) => b.totalRating - a.totalRating);
    }

    res.status(200).json({
      success: true,
      products,
    });
  } catch (err) {
    next(new customError(err));
  }
};
// module.exports.searchProducts = async (req, res, next) => {
//   try {
//     console.log("hello dost", req.query.category);
//     let filterQuery = {};
//     // let searchTerm = req.query.searchTerm || "";
//     // console.log(searchTerm);

//     // if (searchTerm) {
//     //   filterQuery.name = {
//     //     $regex: searchTerm,
//     //     $options: "i", // case-insensitive search
//     //   };
//     // }
//     const searchTerm = req.query.searchTerm;
//     const asc = req.query.asc;
//     const desc = req.query.desc;
//     const rating = req.query.rating;
//     const latest = req.query.latest;
//     const from = req.query.from;
//     const to = req.query.to;
//     console.log("Search term:", searchTerm);
//     console.log("Asc:", asc);
//     console.log("Desc:", desc);
//     console.log("Rating:", rating);
//     console.log("Latest:", latest);
//     console.log("From:", from);
//     console.log("To:", to);
//     if (req.query.category) {
//       filterQuery.category = {
//         $regex: req.query.category,
//         $options: "i", // case-insensitive search
//       };
//     }
//     if (req.query.from && req.query.to) {
//       console.log("from ", req.query.from);
//       console.log("to ", req.query.to);
//       filterQuery.sellingPrice = {
//         $gte: parseInt(req.query.from),
//         $lte: parseInt(req.query.to),
//       };
//     }
//     else if(req.query.from){
//       filterQuery.sellingPrice={
//         $gte:parseInt(req.query.from)
//       }
//     }
//     else if(req.query.to){
//       filterQuery.sellingPrice={
//         $lte:parseInt(req.query.to)
//       }
//     }
//     let boollimit = false;
//     let products;
//     if (req.query.limitproduct) {
//       boollimit = true;
//     }
//     if (req.query.rating) {
//       console.log("rating", req.query.rating);
//       products.sort((a, b) => b.totalRating - a.totalRating);
//     }
//     if (boollimit) {
//       products = await Product.find(filterQuery)
//         .populate("shopId")
//         .limit(req.query.limitproduct);
//     } else {
//       products = await Product.find(filterQuery).populate("shopId");
//     }
//     if (req.query.latest) {
//       console.log("latest", req.query.latest);
//       products.sort((a, b) => b.createdAt - a.createdAt);
//     }

//     if (req.query.asc) {
//       console.log("asc", req.query.asc);
//       products.sort((a, b) => a.sellingPrice - b.sellingPrice);
//     } 
//     if (req.query.desc) {
//       console.log("desc", req.query.desc);
//       products.sort((a, b) => b.sellingPrice - a.sellingPrice);
//     }
//     console.log("count",products.length);
//     res.status(200).json({
//       success: true,
//       message:"get all product after filter",
//       countofproduct:products.length,
//       products,
//     });
//   } catch (err) {
//     next(new customError(err));
//   }
// };