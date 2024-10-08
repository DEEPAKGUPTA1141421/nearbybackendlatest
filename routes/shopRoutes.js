const express = require("express");
const {
  createShop,
  getshopInfo,
  updateShopInfo,
  getAllProduct,
  getAllOrderOfShop,
  bestshop,
  getAllShopOfCity,
  getAllProductForUser,
  gettopshop,
} = require("../controller/shopController");
const { isAuthenticated } = require("../middleware/authorised");
const { createOtp } = require("../controller/userController");
const router = express.Router();

router.post("/create",isAuthenticated, createShop);
router.get("/get",isAuthenticated, getshopInfo);
router.get('/gettopshop',gettopshop);
router.put("/updateshop",isAuthenticated, updateShopInfo);
// get all products
router.get("/getAllProduct",isAuthenticated,getAllProduct);
// get otp
router.get("/createotp",isAuthenticated,createOtp);
// orders placed from this shop

router.get("/getallorderofshop/:id", getAllOrderOfShop);
router.get("/getAllProductforuser/:id",getAllProductForUser);
router.get("/bestshop",bestshop);
router.get("/getallshopofcity/:city",getAllShopOfCity);

module.exports = router;
