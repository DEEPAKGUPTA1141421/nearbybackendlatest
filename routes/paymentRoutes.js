const express = require("express");
const { checkout ,paymentVerification, getkey, savePaymentToDb} = require("../controller/paymentController");
const router = express.Router();

router.post("/checkout",checkout);
router.get("/getkey",getkey);
router.post("/paymentVerification",paymentVerification);
router.post("/savepaymenttodb",savePaymentToDb);
module.exports = router;