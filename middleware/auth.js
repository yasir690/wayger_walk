const jwt = require("jsonwebtoken");
const {
  BadRequestError,
  UnAuthorizedError,
  NotFoundError,
} = require("../resHandler/CustomError");
const prisma = require("../config/prismaConfig");
require("dotenv").config();

const verifyUserToken = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"] || req.headers["authorization"]?.split(" ")[1];

    if (!token || token === "" || token === undefined || token === false) {
      throw new BadRequestError("A token is required for authentication");
    }
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    console.log(decode, "decode");

    const userId = decode.id;
    const userType = decode.userType;

    const findUser = await prisma.user.findFirst({
      where: {
        id: userId,
        userType: userType,
      },
    });
    if (!findUser) {
      throw new NotFoundError("User Not Found");
    }

    req.user = findUser;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new UnAuthorizedError("Token has expired"));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new UnAuthorizedError("Token is Invalid"));
    }
    return next(error);
  }
};

const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"] || req.headers["authorization"]?.split(" ")[1];

    if (!token || token === "" || token === undefined || token === false) {
      throw new BadRequestError("A token is required for authentication");
    }
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    console.log(decode, "decode");

    const adminId = decode.id;
    const userType = decode.userType;

    const findAdmin = await prisma.admin.findFirst({
      where: {
        id: adminId,
        userType: userType,
      },
    });

    if (!findAdmin) {
      throw new NotFoundError("Admin Not Found");
    }

    req.user = findAdmin;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new UnAuthorizedError("Token has expired"));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new UnAuthorizedError("Token is Invalid"));
    }
    return next(error);
  }
};

module.exports = { verifyUserToken, verifyAdminToken };
