const customError = require("../middleware/customError");
const Product = require("../models/product");
const Track = require("../models/tracking");
const Order = require("../models/order");
const Shop = require("../models/shop");
const { createOtp } = require("./shopController");
const driver = require("../config/neo4j");
module.exports.createOrder = async (req, res, next) => {
  const userId = req.user.elementId;
  console.log(userId);
  const orderItemsArray = req.body.orderItems;
  const paymentmode = req.body.paymentmode;
  console.log(paymentmode);
  console.log(orderItemsArray);
  const createdAt = new Date().toISOString();
  console.log(createdAt);
  const session = driver.session();
  const tx = session.beginTransaction();

  try {
    // Create Order node and link it to the User
    for (let i = 0; i < orderItemsArray.length; i++) {
      const productId = orderItemsArray[i].productId;
      const quantity = orderItemsArray[i].quantity;
      const priceperpiece = orderItemsArray[i].priceperpiece;
      const totalprice = priceperpiece * quantity;
      const createOrderQuery = `
  MATCH (u:User)
  WHERE elementId(u)=$userId
  MATCH (p:Product)-[:shop_of]-(s:Shop)
  WHERE elementId(p)=$productId
  CREATE (o:Order {
    orderId: apoc.create.uuid(),
    productId: $productId,
    quantity: $quantity,
    priceperpiece: $priceperpiece,
    totalprice: $totalprice,
    paymentmode: $paymentmode,
    contactNumber: $contactNumber,
    address: $address,
    state: $state,
    country: $country,
    postalCode: $postalCode,
    city: $city,
    status: "ordered",
    createdAt: $createdAt
  })
  CREATE (u)-[:order_list_user]->(o)
  CREATE (s)-[:order_list_shop]->(o)
  RETURN o
`;

const createOrderParams = {
  userId: userId,
  productId: productId,
  quantity: quantity,
  priceperpiece: priceperpiece,
  totalprice: totalprice,
  paymentmode: paymentmode,
  contactNumber: req.body.contactNumber,
  address: req.body.address,
  state: req.body.state,
  country: req.body.country,
  postalCode: req.body.postalCode,
  city: req.body.city,
  createdAt: createdAt
};

      const orderResult = await tx.run(createOrderQuery, createOrderParams);
      const createdOrder = orderResult.records;
      console.log(createdOrder);

      const quantityQuery = `
        MATCH (p:Product)
        WHERE elementId(p) = $productId
        SET p.stock = p.stock - $quantity
        RETURN p
      `;

      const quantityParams = {
        productId: productId,
        quantity: quantity,
      };
      await tx.run(quantityQuery, quantityParams);
    }
    await tx.commit();

    res.status(200).json({
      success: true,
      message: "Order placed successfully",
    });
  } catch (err) {
    await tx.rollback();
    next(new customError(err.message, 400));
  } finally {
    session.close();
  }
};

module.exports.deleteOrder = async (req, res, next) => {
  const id = req.params.id;
  const session = driver.session(); // Assume `driver` is your Neo4j driver instance

  try {
    // Check if the order is in "processing" or "ordered" status
    const result = await session.run(`
      MATCH (o:Order {orderId: $id})
      WHERE o.status = "processing" OR o.status = "ordered"
      RETURN o
    `, { id });

    if (result.records.length === 0) {
      // Order cannot be cancelled if not found or not in correct status
      return next(new customError("Order cannot be cancelled now.", 500));
    }

    // Extract productId and quantity from the result
    const order = result.records[0].get('o').properties;
    const productId = order.productId;
    const quantity = order.quantity;

    // Update the product stock
    await session.run(`
      MATCH (p:Product {productId: $productId})
      SET p.stock = p.stock + $quantity
      RETURN p
    `, {
      productId: productId,
      quantity: quantity
    });

    // Delete the order
    await session.run(`
      MATCH (o:Order {orderId: $id})
      DETACH DELETE o
    `, { id });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (err) {
    // Handle errors
    next(new customError(err.message, 400));
  } finally {
    // Ensure the session is closed
    await session.close();
  }
};


module.exports.updateOrderStatus = async (req, res, next) => {
  const id = req.params.id;
  const userrole=req.user.role;
  const orderstatus = req.body.orderstatus;
  if(userrole=="user"){
     return next(customError("You are Not Authorised",501));
  }
  else if(userrole=="seller"&&orderstatus=="accepted"){

  }
  else if(userrole=="rider"&&orderstatus=="picked"){

  }
  else if(userrole=="rider"&&orderstatus=="delivered"){
     
  }
  else{
    return next(customError("You are Not Authorised",501));
  }
  const session = driver.session();
  try {
      const result=await session.run(`
        MATCH (o:Order {orderId: $id})
        SET o.status=$orderstatus
        return o
        `,{
          id:id,
          orderstatus:orderstatus
        })
        console.log();
    if (result.records.length==0) {
      next(new customError("Order status not updated", 400));
    } else {
      res.status(200).json({
        succes: true,
        message: "Order status updated succesfully",
        result:result.records[0].get('o').properties,
      });
    }
  } catch (err){
    next(new customError(err.message, 400));
  }
};
