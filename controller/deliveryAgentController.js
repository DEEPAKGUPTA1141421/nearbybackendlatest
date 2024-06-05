const customError = require("../middleware/customError");
const Rider = require("../models/rider");
const Order = require("../models/order");
const Track = require("../models/tracking");

module.exports.createRider = async (req, res, next) => {
  try {
    const data = req.body;
    console.log(data);
    const rider = await Rider.findOne({ email: data.email });
    if (rider) {
      console.log("rider already exists");
      next(new customError("rider with this email already exists", 400));
    } else {
      console.log("rider does not already exists");
      const newrider = await Rider.create(data);
      console.log("rider1 already exists");
      if (!newrider) {
        next(new customError("rider not created", 400));
      } else {
        res.status(200).json({
          success: true,
          message: "rider Created successfully",
          rider: newrider,
        });
      }
    }
  } catch (error) {
    next(new customError(error.message, 400));
  }
};

module.exports.deleteorderByRider = async (req, res, next) => {
  const { id } = req.params.id;
  try {
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      next(new customError("Order could not be cancelled", 404));
    }
    res.status(200).json({
      success: true,
      message: "order cancelled successfullly",
    });
  } catch (err) {
    next(new customError("Order could not be cancelled", 404));
  }
};

module.exports.receiveOrder = async (req, res, next) => {
  let otp = req.body.otp;
  let trackingId = req.params.id;
  if (otp) {
    console.log(otp);
    const track = await Track.findById(trackingId);
    console.log(track);
    if (track.sellerotp === otp) {
      const currentTime = Date.now();
      if (currentTime < track.sellerotpExpires) {
        track.status = "picked by rider";
        await track.save();

        res.status(200).json({
          success: true,
          message: "order received from shopkeeper",
          track,
        });
      } else {
        next(new customError("Otp is no longer valid", 400));
      }
    } else {
      next(new customError("Otp did not match", 400));
    }
  } else {
    next(new customError("Otp not found", 400));
  }
};
module.exports.deliverOrder = async (req, res, next) => {
  let otp = req.body.otp;
  let trackingId = req.params.id;
  if (otp) {
    const track = await Track.findById(trackingId);
    if (track.userotp === otp) {
      const currentTime = Date.now();
      if (currentTime < track.userotpExpires) {
        track.status = "delivered by rider";
        await track.save();

        const riderId = track.riderId;
        const rider = await Rider.findById(riderId);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        rider.riderTotalWageArray[currentMonth ] += 80;
        await rider.save();

        res.status(200).json({
          success: true,
          message: "delivered by rider",
          track,
        });
      } else {
        next(new customError("Otp is no longer valid", 400));
      }
    } else {
      next(new customError("Otp did not match", 400));
    }
  } else {
    next(new customError("Otp not found", 400));
  }
};
