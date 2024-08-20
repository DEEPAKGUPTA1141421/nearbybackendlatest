const customError = require("../middleware/customError");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendMail");
const Product = require("../models/product");
const Track = require("../models/tracking");
const Order = require("../models/order");
const mongoose = require("mongoose");
const driver = require("../config/neo4j");
const { getToken } = require("../utils/sendToken");
const {updateUserAndAddressInfo } = require("../utils/query");
const { ObjectId } = mongoose.Types;
const sendToken = async (user, statusCode, message, res) => {
  console.log("hello");
  const token = getToken(user);
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
module.exports.loaduser = async (req, res, next) => {
  try {
    let userNode = req.user;
    if (userNode) {
      res.status(200).json({
        success: true,
        message: "user found",
        userNode,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
  } catch (err) {
    next(new customError(err.message, 404));
  }
};
module.exports.createuserfornow = async (req, res, next) => {
  let session;
  try {
    session = driver.session(); // Start the session

    const {
      fullname,
      email,
      password,
      image,
      role,
      country,
      city,
      address1,
      address2,
      postalCode,
      addressType,
      latitude,
      longitude,
    } = req.body;
    const hashPassworded = await bcrypt.hash(password, 10);
    // Check if user already exists
    const r = await session.run(
      `
        MATCH (u:User {email: $email})
        RETURN u
      `,
      { email: email }
    );

    if (r.records.length > 0) {
      const userNode = r.records[0].get("u");
      if (userNode) {
        return next(new customError("User Already Exists", 404));
      }
    }

    // Create a new user document
    await session.run(
      `CREATE (u:User {
        fullname: $fullname,
        email: $email,
        password: $hashPassworded,
        image: $image,
        role: $role
      })
      RETURN u`,
      { fullname, email, image, hashPassworded, role }
    );

    // Create an address document
    const createAddressResult = await session.run(
      `CREATE (a:Address {
        country: $country,
        city: $city,
        address1: $address1,
        address2: $address2,
        postalCode: $postalCode,
        addressType: $addressType,
        location: point({ latitude: $latitude, longitude: $longitude })
      }) RETURN a`,
      {
        country,
        city,
        address1,
        address2,
        postalCode,
        addressType,
        latitude,
        longitude,
      }
    );

    const addressNode = createAddressResult.records[0].get("a");

    // Link user with the address
    await session.run(
      `
      MATCH (u:User {email: $email})
      MATCH (a:Address) WHERE id(a) = $Id
      CREATE (u)-[:address_list]->(a)
      `,
      { email, Id: addressNode.identity.low }
    );

    // Retrieve and log relationships
    const result = await session.run(
      `
        MATCH (u:User {email: $email})-[r:address_list]->(a:Address)
        RETURN u, r, a
      `,
      { email: email }
    );

    const relationships = result.records.map((record) => ({
      user: record.get("u").properties,
      relationship: record.get("r").type,
      address: record.get("a").properties,
    }));
    console.log("List Relationships:", relationships);

    // Fetch the newly created user
    const user = await session.run(
      `
      MATCH (u:User {email: $email})
      RETURN u
      `,
      { email }
    );

    const userNode = user.records[0].get("u");
    if (userNode) {
      sendToken(userNode, 201, "User Created Successfully", res);
    } else {
      new customError("User Creation Failed", 401);
    }
  } catch (err) {
    next(new customError(err.message, 404));
  } finally {
    if (session) {
      await session.close();
    }
  }
};
module.exports.signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

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
  const { activationToken } = req.body;
  const newuser = await jwt.verify(
    activationToken,
    process.env.jwtActivationSecret
  );
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
  let session;
  try {
    session = driver.session();
    const user = await session.run(
      `
        MATCH (u:User {email: $email})
        RETURN u
      `,
      { email: email }
    );

    if (user.records.length > 0) {
      const userNode = user.records[0].get("u");
      if (!userNode) {
        next(new customError("Wrong Cerrendials", 404));
      } else {
        const decoded = await bcrypt.compare(
          password,
          userNode.properties.password
        );
        if (decoded) {
          sendToken(userNode, 201, "login Succeeful", res);
        } else {
          next(new customError("Wrong   Cerrendials", 404));
        }
      }
    } else {
      next(new customError("Wrong Cerrendials", 404));
    }
  } catch (err) {
    next(new customError(err.message, 400));
  }
};

module.exports.getUser = async (req, res, next) => {
  let id = req.params.id;

  const session = driver.session();
  try {
    const result = await session.run(
      `
        MATCH (u:User)
        WHERE elementId(u) = $id
        RETURN u
        `,
      { id }
    );

    session.close(); // Close the session after the query is done
    console.log(result);
    if (result.records.length > 0) {
      const userNode = result.records[0].get("u");
      res.status(200).json({
        success:true,
        message:"user Found",
        user:userNode
      })
    } else {
      next(new customError("Invalid credentials", 401));
    }
  } catch (err) {
    session.close();
    next(new customError(err.message, 500));
  }
};

module.exports.updateUser = async (req, res, next) => {
  const id = req.user.elementId;
  const data = req.body;
  const response=await updateUserAndAddressInfo(id,data);
  if(!response.success){
    next(new customError("failed To Update",501));
  }
  let session;
  try {
    session=driver.session();
    const user = await session.run(
      `
      MATCH (u:User)-[:address_list]->(a:Address)
      WHERE elementId(u) = $userId
      RETURN u, a
      `,
      {
        userId: id
      }
    );
    
    // Check if any records were returned
    if (user.records.length > 0) {
      // Get the first record (assuming there's only one user and address pair for simplicity)
      const record = user.records[0];
      const userNode = record.get('u');
      const addressNode = record.get('a');
      res.status(200).json({
        success: true,
        message: "user updated successfully",
        userNode,
        addressNode
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
  finally{
    if(session){
      session.close();
    }
  }
};

module.exports.deleteUser = async (req, res, next) => {
  const id = req.user.elementId;
  console.log(req.user);
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User)-[r:address_list]->(a:Address)
      WHERE elementId(u) = $elementId
      DELETE r, u, a
      RETURN u, a
      `,
      { elementId:id}
    );

    // Check if any records were deleted
    if (result.records.length > 0) {
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
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  } finally {
    await session.close();
  }
};

module.exports.orders = async (req, res, next) => {
  const userId = req.user.elementId;
  const session = driver.session();
  try {
    const order = await session.run(`
      MATCH (u:User)-[r:order_list_user]->(o:Order)
      WHERE elementId(u)=$userId
      RETURN o
      `,{
        userId
      });
    console.log(order);  
    const allorder=[];  
    for(let i=0;i<order.records.length;i++){
      const productid=order.records[i].get('o').properties.productId;
      const product=await session.run(`
        MATCH (p:Product)
        where elementId(p)=$productid
        RETURN p
        `,{
          productid
        })
        allorder.push(product.records[0].get('p').properties)
    }
    if (allorder.length==0) {
      next(new customError("No Order Is Found For this shop", 501));
    } else {
        res.status(200).json({
          success: true,
          message: "All the Orders",
          order:allorder,
        });
    }
  } catch (err) {
    next(new customError(err.message, 403));
  }
  finally{
    await session.close();
  }
};

module.exports.addToCart = async (req, res, next) => {
  const productId = req.params.id;
  const userId = req.user.elementId;

  const checkQuery = `
    MATCH (u:User)-[r:cart_list]->(p:Product)
    WHERE elementId(u) = $userId AND elementId(p) = $productId
    RETURN r
  `;

  const createQuery = `
    MATCH (u:User)
    where elementId(u)=$userId
    MATCH (p:Product)
    where elementId(p)=$productId
    CREATE (u)-[:cart_list]->(p)
    RETURN u
  `;

  const params = {
    userId: userId,
    productId: productId
  };

  const session = driver.session();

  try {
    console.log('Checking for existing relationship...');
    const checkResult = await session.run(checkQuery, params);
    console.log('Check query executed');

    const existingRelation = checkResult.records[0]?.get('r');
    console.log('Existing relationship:', existingRelation);

    if (existingRelation) {
      return res.status(200).json({
        success: false,
        message: "Item already in cart"
      });
    }

    console.log('Creating relationship...');
    const createResult = await session.run(createQuery, params);
    const userNode = createResult.records[0]?.get('u');

    if (!userNode) {
      return next(new customError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Added to cart"
    });
  } catch (err) {
    next(new customError("Product not added to cart", 400));
  } finally {
    session.close(); // Ensure the session is closed
  }
};
module.exports.addToWishlist = async (req, res, next) => {
  const productId = req.params.id;
  const userId = req.user.elementId;

  const checkQuery = `
    MATCH (u:User)-[r:wishlist_list]->(p:Product)
    WHERE elementId(u) = $userId AND elementId(p) = $productId
    RETURN r
  `;

  const createQuery = `
    MATCH (u:User)
    where elementId(u)=$userId
    MATCH (p:Product)
    where elementId(p)=$productId
    CREATE (u)-[:wishlist_list]->(p)
    RETURN u
  `;

  const params = {
    userId: userId,
    productId: productId
  };

  const session = driver.session();

  try {
    console.log('Checking for existing relationship...');
    const checkResult = await session.run(checkQuery, params);
    console.log('Check query executed');

    const existingRelation = checkResult.records[0]?.get('r');
    console.log('Existing relationship:', existingRelation);

    if (existingRelation) {
      return res.status(200).json({
        success: false,
        message: "Item already in wishList"
      });
    }

    console.log('Creating relationship...');
    const createResult = await session.run(createQuery, params);
    const userNode = createResult.records[0]?.get('u');

    if (!userNode) {
      return next(new customError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Added to wishList"
    });
  } catch (err) {
    next(new customError("Product not added to WishList", 400));
  } finally {
    session.close(); // Ensure the session is closed
  }
};

module.exports.wishlistToCart = async (req, res, next) => {
  const productId = req.params.id;
  const userId = req.user.elementId; // Assuming userId is stored as elementId in Neo4j

  const checkCartQuery = `
    MATCH (u:User)-[r:cart_list]->(p:Product)
    where elementId(u)=$userId AND elementId(p)=$productId
    RETURN r
  `;

  const removeWishlistQuery = `
    MATCH (u:User)-[r:wishlist_list]->(p:Product)
    where elementId(u)=$userId AND elementId(p)=$productId
    DELETE r
  `;

  const createWishlistQuery = `
    MATCH (u:User)
    where elementId(u)=$userId
    MATCH (p:Product)
    where elementId(p)=$productId
    CREATE (u)-[:cart_list]->(p)
    RETURN u
  `;

  const params = {
    userId: userId,
    productId: productId
  };

  const session = driver.session();

  try {
    // Check if the cart_list relationship exists
    const checkResult = await session.run(checkCartQuery, params);
    const existingRelation = checkResult.records[0]?.get('r');

    if (!existingRelation){
      // Remove the cart_list relationship if it exists
      await session.run(removeWishlistQuery, params);
      await session.run(createWishlistQuery, params);

      res.status(200).json({
        success: true,
        message: "Item moved from wishlist to cart",
      });
    }
    else{
      next(new customError("Items are not in wishlist"),404
    );
    }

    // Create the wishlist_list relationship
   
  } catch (err) {
    next(new customError("Unable to move item from wishlist to cart", 400));
  } finally {
    session.close(); // Ensure the session is closed
  }
};
module.exports.cartToWishlist = async (req, res, next) => {
  const productId = req.params.id;
  const userId = req.user.elementId; // Assuming userId is stored as elementId in Neo4j

  const checkCartQuery = `
    MATCH (u:User)-[r:wishlist_list]->(p:Product)
    where elementId(u)=$userId AND elementId(p)=$productId
    RETURN r
  `;

  const removeWishlistQuery = `
    MATCH (u:User)-[r:cart_list]->(p:Product)
    where elementId(u)=$userId AND elementId(p)=$productId
    DELETE r
  `;

  const createWishlistQuery = `
    MATCH (u:User)
    where elementId(u)=$userId
    MATCH (p:Product)
    where elementId(p)=$productId
    CREATE (u)-[:wishlist_list]->(p)
    RETURN u
  `;

  const params = {
    userId: userId,
    productId: productId
  };

  const session = driver.session();

  try {
    // Check if the cart_list relationship exists
    const checkResult = await session.run(checkCartQuery, params);
    const existingRelation = checkResult.records[0]?.get('r');

    if (!existingRelation) {
      // Remove the cart_list relationship if it exists
      await session.run(removeWishlistQuery, params);
      await session.run(createWishlistQuery, params);

      res.status(200).json({
        success: true,
        message: "Item moved from wishlist to cart",
      });
    }
    else{
      next(new customError("Items already  in Cart"),404
    );
    }

    // Create the wishlist_list relationship
   
  } catch (err) {
    next(new customError("Unable to move item from wishlist to cart", 400));
  } finally {
    session.close(); // Ensure the session is closed
  }
}; 
module.exports.createOtp = async (req, res, next) => {
  const userId = req.user.elementId;
  const session=await driver.session();
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    let userotpExpires = Date.now() + 5 * 60 * 1000;
    const otpNode=await session.run(`
      CREATE (o:Otp {
      otp:$otp,
      userId:$userId,
      userotpExpires:$userotpExpires
      })
      RETURN o
      `,{
        otp,
        userId,
        userotpExpires
      });
    res.status(200).json({
      success: true,
      message: "OTP Sent Successfully",
      otp: otpNode.records[0].get('o').properties,
    });
  } catch (err) {
    next(new customError(err.message, 500));
  }
};
module.exports.verifyOtp = async (req, res, next) => {
  const userId = req.user.elementId;
  const { otp } = req.body;  // Assuming OTP is sent in the request body
  const session = await driver.session();

  try {
    // Fetch the OTP node based on userId and OTP
    const result = await session.run(`
      MATCH (o:Otp {userId: $userId, otp: $otp})
      WHERE o.userotpExpires > datetime()
      RETURN o
    `, {
      userId,
      otp
    });

    if (result.records.length > 0) {
      const otpNode = result.records[0].get('o').properties;
      // OTP is valid and not expired
      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        data: otpNode
      });
    } else {
      // OTP is invalid or expired
      next(new customError("Invalid or expired OTP", 400));
    }
  } catch (err) {
    next(new customError(err.message, 500));
  } finally {
    session.close();
  }
};
module.exports.cartItems = async (req, res, next) => {
  const userId = req.user.elementId; // Assuming userId is stored as elementId in Neo4j

  const query = `
    MATCH (u:User)-[:cart_list]->(p:Product)
    where elementId(u)=$userId
    RETURN p
  `;

  const params = {
    userId: userId
  };

  const session = driver.session();

  try {
    const result = await session.run(query, params);
    const cartItems = result.records.map(record => record.get('p').properties);

    if (cartItems.length > 0) {
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
    next(new customError("Unable to fetch user cart items", 400));
  } finally {
    session.close(); // Ensure the session is closed
  }
};
module.exports.wishlistItems = async (req, res, next) => {
  const userId = req.user.elementId; // Assuming userId is stored as elementId in Neo4j

  const query = `
    MATCH (u:User)-[:wishlist_list]->(p:Product)
    where elementId(u)=$userId
    RETURN p
  `;

  const params = {
    userId: userId
  };

  const session = driver.session();

  try {
    const result = await session.run(query, params);
    const cartItems = result.records.map(record => record.get('p').properties);

    if (cartItems.length > 0) {
      res.status(200).json({
        success: true,
        wishlistItems:cartItems,
      });
    } else {
      res.status(200).json({
        success: false,
        message: "No items in wishlist",
      });
    }
  } catch (err) {
    next(new customError("Unable to fetch user wishlist items", 400));
  } finally {
    session.close(); // Ensure the session is closed
  }
};
module.exports.removeItemFromWishlist = async (req, res, next) => {
  const userId = req.user.elementId; // Assuming userId is stored as elementId in Neo4j
  const productId = req.params.id;

  const session = driver.session();

  try {
    // Remove wishlist_list relationship in Neo4j
    const removeWishlistQuery = `
      MATCH (u:User)-[r:wishlist_list]->(p:Product)
      where elementId(u)=$userId AND  elementId(p)=$productId
      DELETE r
      RETURN p
    `;

    const params = {
      userId: userId,
      productId: productId
    };

    const result = await session.run(removeWishlistQuery, params);

    const userNode = result.records[0]?.get('p');

    if (!userNode) {
      return res.status(404).json({
        success: false,
        message: "product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Item removed from wishlist",
    });
  } catch (err) {
    next(new customError("Unable to remove item from wishlist", 400));
  } finally {
    session.close(); // Ensure the session is closed
  }
};
module.exports.removeItemFromCart = async (req, res, next) => {
  const userId = req.user.elementId; // Assuming userId is stored as elementId in Neo4j
  const productId = req.params.id;

  const session = driver.session();

  try {
    // Remove wishlist_list relationship in Neo4j
    const removeWishlistQuery = `
      MATCH (u:User)-[r:cart_list]->(p:Product)
      where elementId(u)=$userId AND  elementId(p)=$productId
      DELETE r
      RETURN p
    `;

    const params = {
      userId: userId,
      productId: productId
    };

    const result = await session.run(removeWishlistQuery, params);

    const userNode = result.records[0]?.get('p');

    if (!userNode) {
      return res.status(404).json({
        success: false,
        message: "product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Item removed from cartList",
    });
  } catch (err) {
    next(new customError("Unable to remove item from wishlist", 400));
  } finally {
    session.close(); // Ensure the session is closed
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
  const userId = req.user.elementId; 
  const session = driver.session();

  try {
    // Remove wishlist_list relationship in Neo4j
    const removeWishlistQuery = `
      MATCH (u:User)-[r:cart_list]->(p:Product)
      where elementId(u)=$userId
      DELETE r
      RETURN p
    `;

    const params = {
      userId: userId,
    };

    const result = await session.run(removeWishlistQuery, params);

    const userNode = result.records[0]?.get('p');

    if (!userNode) {
      return res.status(404).json({
        success: false,
        message: "No product found",
      });
    }

    res.status(200).json({
      success: true,
      message: "All Item removed from cartList",
    });
  } catch (err) {
    next(new customError("Unable to remove item from cartlist", 400));
  } finally {
    session.close(); // Ensure the session is closed
  }
};
