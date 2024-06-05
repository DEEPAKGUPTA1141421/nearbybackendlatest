const express = require("express");
const {
  getAllProductsInProcessing,
  allocateOrders,
  createPayment,
  paySeller,
  payRider,
  getinfopaymentrider,
  getinfopaymentseller,
} = require("../controller/adminController");
const { isAuthenticated } = require("../middleware/authorised");
const router = express.Router();

router.get("/get", isAuthenticated,getAllProductsInProcessing);
router.get("/getriderpayment",getinfopaymentrider);
router.get("/getsellerpayment",getinfopaymentseller);
router.post("/createpayment", createPayment);
router.post("/allocateOrder/:trackingid", allocateOrders);
router.post("/payseller", paySeller);
router.post("/payrider", payRider);

module.exports = router;
