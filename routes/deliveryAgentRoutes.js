const express = require("express");
const {
  deleteorderByRider,
  createRider,
  receiveOrder,
  deliverOrder,
} = require("../controller/deliveryAgentController");
const router = express.Router();

router.post("/create", createRider);
router.delete("/delete/:id", deleteorderByRider);
// received from shopkeeper
router.get("/receiveOrder/:id", receiveOrder);
// deliver to user
router.get("/deliverOrder/:id", deliverOrder);
// update rider profile

module.exports = router;