const express = require("express");
const { createOrder,deleteOrder,updateOrderStatus } = require("../controller/orderController");
const { isAuthenticated } = require("../middleware/authorised");
const router = express.Router();

router.post("/create",isAuthenticated,createOrder);
// router.put("/update/:id",updateOrderStatus);
router.delete("/delete/:id",deleteOrder);

module.exports = router;