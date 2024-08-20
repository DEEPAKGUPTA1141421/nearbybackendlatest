const customError = require("../middleware/customError");
const Rider = require("../models/rider");
const Order = require("../models/order");
const Track = require("../models/tracking");
const driver = require("../config/neo4j");
module.exports.createRider = async (req, res, next) => {
  const {
    name,email,phoneNumber,city,adhaharNumber,panNumber,age,gender,policeCase,password,
    imageofrider,role = "Rider",jointAt = new Date(),typeOfVan,nameOfVan,
    riderTotalWageArray = new Array(12).fill(0),
    riderTotalPaymentArray = new Array(12).fill(0),
    riderTotalRemainingArray = new Array(12).fill(0),
  } = req.body;
  const checkQuery = `
    MATCH (r:Rider {email: $email})
    RETURN r
  `;
  const createQuery = `
    CREATE (r:Rider {
      name: $name,
      email: $email,
      phoneNumber: $phoneNumber,
      city: $city,
      adhaharNumber: $adhaharNumber,
      panNumber: $panNumber,
      age: $age,
      gender: $gender,
      policeCase: $policeCase,
      password: $password,
      imageofrider: $imageofrider,
      role: $role,
      jointAt: $jointAt,
      typeOfVan: $typeOfVan,
      nameOfVan: $nameOfVan,
      riderTotalWageArray: $riderTotalWageArray,
      riderTotalPaymentArray: $riderTotalPaymentArray,
      riderTotalRemainingArray: $riderTotalRemainingArray
    })
    RETURN id(r) AS riderId
  `;
  const session=await driver.session();
  try {
    const result = await session.run(checkQuery, { email });
    if (result.records.length > 0) {
      next(new customError("Rider with this email already exists", 400));
    } else {
      const createResult = await session.run(createQuery, {
        name,
        email,
        phoneNumber,
        city,
        adhaharNumber,
        panNumber,
        age,
        gender,
        policeCase,
        password,
        imageofrider,
        role,
        jointAt,
        typeOfVan,
        nameOfVan,
        riderTotalWageArray,
        riderTotalPaymentArray,
        riderTotalRemainingArray
      });
      const riderId = createResult.records[0].get('riderId');
      res.status(200).json({
        success: true,
        message: "Rider created successfully",
        riderId: riderId
      });
    }
  } catch (error) {
    next(new customError(error.message, 400));
  }
  finally{
    await session.close();
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
    const track = await Track.findById(trackingId);
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
