const express = require("express");
const {deleteOrder,updateOrderStatus, createOrder } = require("../controller/orderController");
const { isAuthenticated } = require("../middleware/authorised");
const router = express.Router();

router.post("/create",isAuthenticated,createOrder);
router.put("/update/:id",isAuthenticated,updateOrderStatus);
router.delete("/delete/:id",isAuthenticated,deleteOrder);

module.exports = router;