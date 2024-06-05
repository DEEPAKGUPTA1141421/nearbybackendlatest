const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    image: {
      type: String,
    },
    address: {
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      address1: {
        type: String,
      },
      address2: {
        type: String,
      },
      postalCode: {
        type: String,
      },
      addressType: {
        type: String,
      },
    },
    role: {
      type: String,
      enum: ["user", "seller"],
      default: "user",
    },
    order: [
      {
        orderId: {
          type: mongoose.Schema.ObjectId,
          ref: "Order",
          required: true,
        },
      },
    ],
    cart: [
      {
        productId: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    wishlist: [
      {
        productId: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    resetPasswordToken: String,
    resetPasswordTime: Date,
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.checkPassword = async function (currentpassword) {
  const decoded = await bcrypt.compare(currentpassword, this.password);
  return decoded;
};

userSchema.methods.getToken = function () {
  const jwtSecretKey = process.env.JwtSecretKey;
  const jwtExpires = process.env.jwtExpires;
  return jwt.sign({ id: this._id }, jwtSecretKey, {
    expiresIn: jwtExpires,
  });
};
const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
