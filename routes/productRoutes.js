const express = require("express");
const {
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
  productrating,
  addComment,
  findNearbyProducts,
  findNearbyShop,
  searchAndFindNearbyProducts
} = require("../controller/productController");
const { isAuthenticated } = require("../middleware/authorised");
const router = express.Router();

router.get("/get/:id", getProduct);
router.get("/search",isAuthenticated,searchAndFindNearbyProducts);
router.post("/create",isAuthenticated ,createProduct);
router.put("/update/:id",isAuthenticated, updateProduct);
router.get("/productrating/:id",isAuthenticated, productrating);
router.get("/addcomment/:id",isAuthenticated, addComment);
router.delete("/delete/:id",isAuthenticated, deleteProduct);
router.get("/searchbydist",isAuthenticated,findNearbyProducts);
router.get("/searchnearshop",isAuthenticated,findNearbyShop);
module.exports = router;