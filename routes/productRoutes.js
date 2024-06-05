const express = require("express");
const {
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
  searchProducts
} = require("../controller/productController");
const { isAuthenticated } = require("../middleware/authorised");
const router = express.Router();

router.get("/get/:id", getProduct);
router.get("/search",searchProducts);
router.post("/create/:shopId",isAuthenticated,createProduct);
router.put("/update/:id",isAuthenticated, updateProduct);
router.delete("/delete/:id",isAuthenticated, deleteProduct);
module.exports = router;