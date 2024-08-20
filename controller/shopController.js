const customError = require("../middleware/customError");
const Shop = require("../models/shop");
const Track = require("../models/tracking");
const Order = require("../models/order");
const Product=require("../models/product");
const driver = require("../config/neo4j");
module.exports.gettopshop=async(req,res,next)=>{
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
}
module.exports.createShop = async (req, res, next) => {
  const data = req.body;
  const userId = req.user.elementId;
  const session = driver.session();

  try {
    // Check if shop already exists
    const result = await session.run(
      `
        MATCH (u:User)
        WHERE elementId(u) = $id
        RETURN u
        `,
      { id:userId }
    );
    let userNode;
    if (result.records.length > 0) {
       userNode = result.records[0].get("u");
    } else {
      next(new customError("Invalid credentials", 401));
    }
    const existingShop = await session.run(
      `
      MATCH (s:Shop {email: $email})
      RETURN s
      `,
      { email: userNode.properties.email}
    );

    if (existingShop.records.length > 0) {
      res.status(400).json({
        success: false,
        message: "Shop already exists"
      });
    } else {
      // Create the shop node
      const result = await session.run(
        `
        CREATE (s:Shop {
          shopname: $shopname,
          ownername: $ownername,
          email: $email,
          contactNumber: $contactNumber,
          aadharCard: $aadharCard,
          state: $state,
          city: $city,
          district: $district,
          postalCode: $postalCode,
          location: point({ latitude: $latitude, longitude: $longitude }),
          category: $category,
          createdAt: timestamp()
        })
        RETURN s
        `,
        {
          shopname: data.shopname,
          ownername: data.ownername,
          email:userNode.properties.email,
          contactNumber: data.contactNumber,
          aadharCard: data.aadharCard,
          state: data.state,
          city: data.city,
          district: data.district,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.category
        }
      );

      const shop = result.records[0].get('s').properties;
      
      res.status(200).json({
        success: true,
        message: "Shop created successfully",
        shop
      });
    }
  } catch (err) {
    next(new customError(err.message, 404));
  } finally {
    await session.close();
  }
};

module.exports.getshopInfo = async (req, res, next) => {
  const userId = req.user.elementId;
  const session = driver.session();

  try {
    // Check if shop already exists
    const result = await session.run(
      `
        MATCH (u:User)
        WHERE elementId(u) = $id
        RETURN u
        `,
      { id:userId }
    );
    let userNode;
    if (result.records.length >0) {
       userNode = result.records[0].get("u");
    } else {
      next(new customError("Invalid credentials", 401));
    }
  try {
    const result = await session.run(
      `
      MATCH (s:Shop {email: $email})
      RETURN s
      `,
      { email:userNode.properties.email }
    );

    const shopRecord = result.records[0];

    if (!shopRecord) {
      res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    } else {
      const shop = shopRecord.get('s');
      res.status(200).json({
        success: true,
        message: "Shop found successfully",
        shop,
      });
    }
  } catch (err) {
    next(new customError(err.message, 404));
  } finally {
    await session.close();
  }
  }
   catch (err) {
    next(new customError(err.message, 404));
  }
};

module.exports.updateShopInfo = async (req, res, next) => {
  const data = req.body;
  const session = driver.session();
  const userId = req.user.elementId;
  try {
    const user = await session.run(
      `
        MATCH (u:User)
        WHERE elementId(u) = $id
        RETURN u
        `,
      { id:userId }
    );
    let userNode;
    if (user.records.length >0) {
       userNode = user.records[0].get("u");
    } else {
      next(new customError("Invalid credentials", 401));
    }
    let setClause = '';
    const params = { email:userNode.properties.email};

    if (data.shopname) {
      setClause += 's.shopname = $shopname, ';
      params.shopname = data.shopname;
    }
    if (data.ownername) {
      setClause += 's.ownername = $ownername, ';
      params.ownername = data.ownername;
    }
    if (data.contactNumber) {
      setClause += 's.contactNumber = $contactNumber, ';
      params.contactNumber = data.contactNumber;
    }
    if (data.aadharCard) {
      setClause += 's.aadharCard = $aadharCard, ';
      params.aadharCard = data.aadharCard;
    }
    if (data.state) {
      setClause += 's.state = $state, ';
      params.state = data.state;
    }
    if (data.city) {
      setClause += 's.city = $city, ';
      params.city = data.city;
    }
    if (data.district) {
      setClause += 's.district = $district, ';
      params.district = data.district;
    }
    if (data.postalCode) {
      setClause += 's.postalCode = $postalCode, ';
      params.postalCode = data.postalCode;
    }
    if (data.latitude) {
      setClause += 's.latitude = $latitude, ';
      params.latitude = data.latitude;
    }
    if (data.longitude) {
      setClause += 's.longitude = $longitude, ';
      params.longitude = data.longitude;
    }
    if (data.category) {
      setClause += 's.category = $category, ';
      params.category = data.category;
    }
    if (data.location) {
      setClause += 's.location = $location, ';
      params.location = data.location;
    }

    // Remove trailing comma and space
    setClause = setClause.slice(0, -2);

    const result = await session.run(
      `
      MATCH (s:Shop {email: $email})
      SET ${setClause}
      RETURN s
      `,
      params
    );

    const shopRecord = result.records[0];

    if (!shopRecord) {
      res.status(400).json({
        success: false,
        message: "Update shop failed",
      });
    } else {
      const shop = shopRecord.get('s');
      res.status(200).json({
        success: true,
        message: "Shop updated successfully",
        shop,
      });
    }
  } catch (error) {
    next(new customError(error.message, 500));
  } finally {
    await session.close();
  }
};
module.exports.getAllOrderOfShop = async (req, res, next) => {
  const shopId = req.params.id;
  console.log(shopId);
  const session = driver.session();
  try {
    const order = await session.run(`
      MATCH (s:Shop)-[r:order_list_shop]->(o:Order)
      WHERE elementId(s)=$shopId
      RETURN o
      `,{
        shopId:shopId
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
    if (allorder.length==-0) {
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
module.exports.bestshop=async(req,res,next)=>{
  try{
    const order=await Order.find().populate("orderItems.product").exec();
    const shopMap = new Map();
    for(let i=0;i<order.length;i++){
      for(let j=0;j<order[i].orderItems[j].length;j++){
        if(shopMap.has(order[i].orderItems[j].product.shopId)){
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
  const session = await driver.session();
  const queryobj = req.query;
  const page = parseInt(queryobj.page) || parseInt(1);
  const limit = parseInt(queryobj.limit) || parseInt(10);
  const skip = (page - 1) * limit;

  try {
    // Build the WHERE clause for filtering
    let whereClause = [];
    if (queryobj.subcategory) {
      whereClause.push(`p.subcategory = '${queryobj.subcategory}'`);
    }
    if (queryobj.genderSpecific) {
      whereClause.push(`p.genderSpecific = '${queryobj.genderSpecific}'`);
    }
    if (queryobj.stock) {
      whereClause.push(`p.stock >= ${parseFloat(queryobj.stock)}`);
    }
    if (queryobj.category) {
      whereClause.push(`p.category = '${queryobj.category}'`);
    }
    if (queryobj.name) {
      whereClause.push(`toLower(p.name) =~ '(?i).*${queryobj.name}.*'`);
    }
    if (queryobj.description) {
      whereClause.push(`toLower(p.description) =~ '(?i).*${queryobj.description}.*'`);
    }
    if (queryobj.from && queryobj.to) {
      whereClause.push(`p.sellingPrice >= ${parseFloat(queryobj.from)} AND p.sellingPrice <= ${parseFloat(queryobj.to)}`);
    } else if (queryobj.from) {
      whereClause.push(`p.sellingPrice >= ${parseFloat(queryobj.from)}`);
    } else if (queryobj.to) {
      whereClause.push(`p.sellingPrice <= ${parseFloat(queryobj.to)}`);
    }
    whereClause = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    // Build the ORDER BY clause for sorting
    let orderByClause = [];
    if (queryobj.sortOnsellingPrice) {
      orderByClause.push(`p.sellingPrice ${queryobj.sortOnsellingPrice === 'asc' ? 'ASC' : 'DESC'}`);
    }
    if (queryobj.sortOnrating) {
      orderByClause.push(`p.rating ${queryobj.sortOnrating === 'asc' ? 'ASC' : 'DESC'}`);
    }
    orderByClause = orderByClause.length > 0 ? `ORDER BY ${orderByClause.join(', ')}` : '';

    // Cypher query to find products based on filters and sorting
    const cypherQuery = `
      MATCH (p:Product)
      ${whereClause}
      ${orderByClause}
      RETURN p
    `;

    const result = await session.run(cypherQuery);

    const products = result.records.map(record => record.get('p').properties);

    // Get the total count for pagination info
    const countQuery = `
      MATCH (p:Product)
      ${whereClause}
      RETURN COUNT(p) AS totalCount
    `;
    const countResult = await session.run(countQuery);
    const totalCount = countResult.records[0].get('totalCount').toInt();
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      count: products.length,
      totalCount: totalCount,
      totalPages: totalPages,
      currentPage: page,
      success: true,
      message: "Get different types of products",
      products: products
    });
  } catch (err) {
    next(new customError(err.message, 404));
  } finally {
    session.close();
  }
}
module.exports.getAllShopOfCity=async(req,res,next)=>{
  const {city}=req.params;
  try{
    const shoplist = await Shop.find({ location: { $regex: new RegExp(city, 'i') } });
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
module.exports.getAllProduct = async (req, res, next) => {
  const session = await driver.session();
  const {emailshop} = req.body; // Assuming user ID is stored here
  const queryobj = req.query;

  try {
    // Build the WHERE clause for filtering
    let whereClause = [];
    if (queryobj.subcategory) {
      whereClause.push(`p.subcategory = '${queryobj.subcategory}'`);
    }
    if (queryobj.category) {
      whereClause.push(`p.category = '${queryobj.category}'`);
    }
    if (queryobj.name) {
      whereClause.push(`toLower(p.name) =~ '(?i).*${queryobj.name}.*'`);
    }
    if (queryobj.description) {
      whereClause.push(`toLower(p.description) =~ '(?i).*${queryobj.description}.*'`);
    }
    if (queryobj.from && queryobj.to) {
      whereClause.push(`p.sellingPrice >= ${parseFloat(queryobj.from)} AND p.sellingPrice <= ${parseFloat(queryobj.to)}`);
    } else if (queryobj.from) {
      whereClause.push(`p.price >= ${parseFloat(queryobj.from)}`);
    } else if (queryobj.to) {
      whereClause.push(`p.price <= ${parseFloat(queryobj.to)}`);
    }
    whereClause = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    // Build the ORDER BY clause for sorting
    let orderByClause = [];
    if (queryobj.sortOnsellingPrice) {
      orderByClause.push(`p.sellingPrice ${queryobj.sortOnsellingPrice === 'asc' ? 'ASC' : 'DESC'}`);
    }
    orderByClause = orderByClause.length > 0 ? `ORDER BY ${orderByClause.join(', ')}` : '';

    // Cypher query to find products based on filters and sorting
    const query = `
      MATCH (p:Product)-[:shop_of]->(s:Shop{email:$emailshop})
      ${whereClause}
      ${orderByClause}
      RETURN p
    `;

    const result = await session.run(query,{emailshop});

    const products = result.records.map(record => record.get('p').properties);

    res.status(200).json({
      count: products.length,
      success: true,
      message: "Get Different Types products",
      products: products
    });
  } catch (err) {
    next(new customError(err.message, 404));
  } finally {
    session.close();
  }
};