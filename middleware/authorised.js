const jwt = require("jsonwebtoken");
const customError = require("./customError");
const driver = require("../config/neo4j");
module.exports.isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new customError("Please login to access the routes", 401));
  }

  try {
    const decodeData = await jwt.verify(token, process.env.JwtSecretKey);
    const id = decodeData.id;

    const session = driver.session();

    try {
      const result = await session.run(
        `
        MATCH (u:User)
        WHERE elementId(u) = $id
        RETURN u
        `,
        { id}
      );

      session.close(); 
      if (result.records.length > 0) {
        const userNode = result.records[0].get("u");
        req.user = userNode;
        next();
      } else {
        next(new customError("Invalid credentials", 401));
      }
    } catch (err) {
      session.close();
      next(new customError(err.message, 500));
    }
  } catch (err) {
    next(new customError("Invalid token", 401));
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
