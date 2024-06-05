const jwt = require("jsonwebtoken");
const customError = require("./customError");
const User = require("../models/user");
module.exports.isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  console.log("token", token);
  if (!token) {
    next(new customError("Please Login To Access The Routes", 404));
  } else {
    const decodeData = await jwt.verify(token, process.env.JwtSecretKey);
    req.user = await User.findById(decodeData.id);
    next();
  }
};
module.exports.authorizeRoles = (...Roles) => {
  return (req, res, next) => {
    if (!Roles.includes(req.user.role)) {
      next(
        new customError(`${req.user.role} is not allowed to do this thing`, 500)
      );
    } else {
      return next();
    }
  };
};
