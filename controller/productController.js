const customError = require("../middleware/customError");
const Product = require("../models/product");
const Shop = require("../models/shop");
const cloudinary=require("cloudinary");
const neo4j = require('neo4j-driver');
const { findShopByEmail } = require("../utils/query");
const driver = require("../config/neo4j");
module.exports.createProduct = async (req, res, next) => {
  const data = req.body;
  let email;
  const uploadedImages = req.body.images;
  console.log(uploadedImages);
  const {
    name,
    description,
    actualPrice,
    discountPrice,
    sellingPrice,
    stock,
    category,
    subcategory,
    genderspecific,
    latitude,
    longitude
  } = data;

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
       email=userNode.properties.email;
    }
    else{
      next(new customError("User Not Present"),404);
    }
    const createdAt = new Date().toISOString();
    const productResult = await session.run(
      `
      CREATE (p:Product {
        location: point({ latitude: $latitude, longitude: $longitude }),
        name: $name,
        description: $description,
        actualPrice: $actualPrice,
        discountPrice: $discountPrice,
        sellingPrice: $sellingPrice,
        stock: $stock,
        category: $category,
        genderSpecific: $genderspecific,
        images: $images,
        subcategory: $subcategory,
        createdAt:$createdAt
      })
      WITH p
      MATCH (s:Shop {email: $email})
      CREATE (s)-[:product_list]->(p)
      CREATE (p)-[:shop_of]->(s)
      RETURN p
      `,
      {
        latitude,
        longitude,
        name,
        description,
        actualPrice: actualPrice,
        discountPrice: discountPrice,
        sellingPrice: sellingPrice,
        stock:stock,
        category,
        genderspecific: genderspecific,
        images: "uploadedImages",
        subcategory:subcategory,
        createdAt:createdAt,
        email:email,
      }
    );

    const productCreated = productResult.records[0].get('p');

    res.status(200).json({
      success: true,
      message: "Product created successfully",
      productCreated,
    });
  } catch (err) {
    next(new customError(err.message, 400));
  } finally {
    await session.close();
  }
};

module.exports.getProduct = async (req, res, next) => {
  let productId = req.params.id;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Product)-[:product_list]->(s:Shop)
      WHERE elementId(p) = $productId
      RETURN p, s
      `,
      { productId: productId }
    );
    

    const productRecord = result.records[0];

    if (!productRecord) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
    } else {
      const product = productRecord.get('p').properties;
      const shop = productRecord.get('s').properties;
      res.status(200).json({
        success: true,
        message: "Product found",
        product: {
          ...product,
          shop: shop
        },
      });
    }
  } catch (err) {
    next(new customError(err.message, 500));
  } finally {
    await session.close();
  }
};

module.exports.updateProduct = async (req, res, next) => {
  const productId = req.params.id;
  const productDetails = req.body;
  const email =req.user.properties.email;
  const session = driver.session();
  const query = `
    MATCH (p:Product)-[:product_list]-(s:Shop {email:$email} )
    WHERE elementId(p) = $productId
    SET p += $productDetails
    RETURN p
  `;

  const params = {
    productId: productId,
    productDetails: productDetails,
    email:email
  };

  try {
    const result = await session.run(query, params);
    const updatedProduct = result.records[0]?.get('p').properties;

    if (updatedProduct) {
      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct
      });
    } else {
      next(new customError("Failed to update product", false, res));
    }
  } catch (err) {
    next(new customError(err.message,404));
  } finally {
    session.close();
  }
};

module.exports.deleteProduct = async (req, res, next) => {
  const productId = req.params.id;
  const email =req.user.properties.email;
  const session = driver.session();
  const query = `
  MATCH (p:Product)-[:product_list]-(s:Shop{email:$email})
  where elementId(p)=$productId
  DETACH DELETE p
`;

const params = { productId: productId,email:email };

try {
  const deleteproduct=await session.run(query, params);
  if(!deleteproduct){
    next(new customError("Failed to delete product",501));
  }
  else{
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  }
}
catch(err){
  next(new customError("Failed to delete product from MongoDB",501));
}
finally {
  session.close();
}
};
module.exports.searchAndFindNearbyProducts = async (req, res, next) => {
  const session = await driver.session();
  const queryobj = req.query;
  console.log(req.query);
  const page = parseInt(queryobj.page) || 1;
  const limit = parseInt(queryobj.limit) || 10;
  const skip = (page - 1) * limit;

  const userEmail = req.user.properties.email;
  console.log(typeof(Number(queryobj.distance)));
  const maxDistanceMeters = (Number(queryobj.distance) || 0) * 1000; // distance in meters

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

    // Cypher query to find products based on filters and distance
    const cypherQuery = `
      MATCH (u:User {email:$email})-[:address_list]->(a:Address)
      WITH point({srid: 4326, x: a.location.longitude, y: a.location.latitude}) AS userPoint
      MATCH (p:Product)
      WHERE point.distance(userPoint, point({srid: 4326, x: p.location.longitude, y: p.location.latitude})) <= $maxDistance
      ${whereClause}
      ${orderByClause}
      RETURN p, point.distance(userPoint, point({srid: 4326, x: p.location.longitude, y: p.location.latitude})) AS distance
    `;

    // Run the query
    const result = await session.run(cypherQuery, {
      email: userEmail,
      maxDistance: maxDistanceMeters,
      skip: skip,
      limit: limit
    });

    const products = result.records.map(record => {
      // Convert distance to a number
      const distance = record.get('distance');
      const distanceValue = distance.toNumber ? distance.toNumber() : Number(distance);
    
      return {
        product: record.get('p').properties,
        distance: distanceValue
      };
    });

    // Get the total count for pagination info
    const countQuery = `
      MATCH (u:User {email:$email})-[:address_list]->(a:Address)
      WITH point({srid: 4326, x: a.location.longitude, y: a.location.latitude}) AS userPoint
      MATCH (p:Product)
      WHERE point.distance(userPoint, point({srid: 4326, x: p.location.longitude, y: p.location.latitude})) <= $maxDistance
      ${whereClause}
      RETURN COUNT(p) AS totalCount
    `;
    const countResult = await session.run(countQuery, { email: userEmail, maxDistance: maxDistanceMeters });
    const totalCount = countResult.records[0].get('totalCount').toInt();
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      count: products.length,
      totalCount: totalCount,
      totalPages: totalPages,
      currentPage: page,
      success: true,
      message: "Products retrieved successfully",
      products: products
    });
  } catch (err) {
    next(new customError(err.message, 500));
  } finally {
    await session.close();
  }
};


module.exports.productrating = async (req, res, next) => {
  const session = await driver.session();
  const userId = req.user.elementId;
  const productId = req.params.id;
  const rating = req.body.rating;

  if (rating > 5) {
    return next(new customError("Rating can't be greater than 5", 501));
  }

  try {
    // Check if the rating already exists
    const resultNode = await session.run(`
      MATCH (r:ProductRating {userId: $userId, productId: $productId})
      RETURN r
    `, {
      userId,
      productId
    });

    if (resultNode.records.length > 0) {
      // Update existing rating
      const updateNode = await session.run(`
        MATCH (r:ProductRating {userId: $userId, productId: $productId})
        SET r.rating = $rating
        RETURN r
      `, {
        userId,
        productId,
        rating
      });

      if (updateNode.records.length > 0) {
        return res.status(200).json({
          success: true,
          message: "Rating updated successfully",
        });
      } else {
        return next(new customError("Internal Server Error", 501));
      }
    } 

    // Create new rating
    const result = await session.run(`
      CREATE (r:ProductRating {
        rate: $rating,
        userId: $userId,
        productId: $productId
      })
      RETURN r
    `, {
      rating,
      userId,
      productId
    });

    if (result.records.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Rating successfully added",
      });
    } else {
      return next(new customError("Internal Server Error", 501));
    }
  } catch (err) {
    return next(new customError(err.message, 404));
  } finally {
    session.close();
  }
};
module.exports.addComment = async (req, res, next) => {
  const session = await driver.session();
  const userId = req.user.elementId;
  const productId = req.params.id;
  const comment = req.body.comment;

  if (!comment){
    return next(new customError("Rating can't be greater than 5", 501));
  }

  try {
    const result = await session.run(`
      CREATE (r:ProductComment {
        comment: $comment,
        userId: $userId,
        productId: $productId
      })
      RETURN r
    `, {
      comment,
      userId,
      productId
    });

    if (result.records.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Comment successfully added",
      });
    } else {
      return next(new customError("Internal Server Error", 501));
    }
  } catch (err) {
    return next(new customError(err.message, 404));
  } finally {
    session.close();
  }
};
module.exports.findNearbyProducts = async (req, res, next) => {
  const maxDistanceMeters = (req.body.distance) * 1000; 
  console.log(req.body);
  const userEmail=req.user.properties.email;
  const session=await driver.session();
  try {
    const result = await session.run(`
      MATCH (u:User {email:$email})-[:address_list]->(a:Address)
      WITH point({srid: 4326, x: a.location.longitude, y: a.location.latitude}) AS userPoint
      MATCH (p:Product)
      WHERE point.distance(userPoint, point({srid: 4326, x: p.location.longitude, y: p.location.latitude})) <= $maxDistance
      RETURN p, point.distance(userPoint, point({srid: 4326, x: p.location.longitude, y: p.location.latitude})) AS distance
      ORDER BY distance ASC
    `, {
      email: userEmail,
      maxDistance: maxDistanceMeters
    });
    
    // Process and return results
    const products = result.records.map(record => {
      // Convert distance to a number
      const distance = record.get('distance');
      const distanceValue = distance.toNumber ? distance.toNumber() : Number(distance);
    
      return {
        product: record.get('p').properties,
        distance: distanceValue
      };
    });

    console.log('Nearby Products:', products);
    res.status(201).json({
      message:"All Products",
      products
    })

    return products;
} catch (err) {
        next(new customError(err.message,501));
    } finally {
        await session.close();
    }
};


module.exports.findNearbyShop = async (req, res, next) => {
  const maxDistanceMeters = (req.body.distance) * 1000; 
  console.log(req.body);
  const {category}=req.body;
  const userEmail=req.user.properties.email;
  const session=await driver.session();
  try {
    const result = await session.run(`
      MATCH (u:User {email:$email})-[:address_list]->(a:Address)
      WITH point({srid: 4326, x: a.location.longitude, y: a.location.latitude}) AS userPoint
      MATCH (p:Shop)
      WHERE point.distance(userPoint, point({srid: 4326, x: p.location.longitude, y: p.location.latitude})) <= $maxDistance AND p.category=$category
      RETURN p, point.distance(userPoint, point({srid: 4326, x: p.location.longitude, y: p.location.latitude})) AS distance
      ORDER BY distance ASC
    `, {
      email: userEmail,
      maxDistance: maxDistanceMeters,
      category:category
    });
    
    // Process and return results
    const shops = result.records.map(record => {
      // Convert distance to a number
      const distance = record.get('distance');
      const distanceValue = distance.toNumber ? distance.toNumber() : Number(distance);
    
      return {
        shop: record.get('p').properties,
        distance: distanceValue
      };
    });
    if(shops.length==0){
      return res.status(201).json({
        message:"No Shop For This  Shops",
      })
    }
    res.status(201).json({
      message:"All Shops",
      shops
    })
} catch (err) {
        next(new customError(err.message,501));
    } finally {
        await session.close();
    }
};