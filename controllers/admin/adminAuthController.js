const prisma = require("../../config/prismaConfig");
const { userConstants } = require("../../constants/constants");
const {  NotFoundError, BadRequestError, ValidationError } = require("../../resHandler/CustomError");
const { handlerOk } = require("../../resHandler/responseHandler");
const { genToken } = require("../../utils/generateToken");
const { comparePassword } = require("../../utils/passwordHashed");




const adminLogin = async (req, res, next) => {
  try {
    const { email, password, deviceToken } = req.body;

    const findadmin = await prisma.admin.findUnique({
      where: {
        email: email
      }
    });

    if (!findadmin) {
      throw new NotFoundError("admin not found");

    }

    const comparedPassword = await comparePassword(password, findadmin.password);

    if (!comparedPassword) {
      throw new BadRequestError("password not correct")
    }

    const token = await genToken({
      id: findadmin.id,
      userType: userConstants.ADMIN
    });

    const response = {
      adminToken: token
    }

    if (deviceToken) {
      response.deviceToken = deviceToken;

      await prisma.admin.update({
        where: {
          id: findadmin.id
        },
        data: {
          deviceToken: deviceToken
        }
      })
    }


    handlerOk(res, 200, { ...findadmin, ...response }, "admin login successfully")

  } catch (error) {
    next(error)
  }
}

const editImage = async (req, res, next) => {
  try {
    const file = req.file;
    const { id } = req.user;

    const filePath = file.filename; // use filename instead of path
    const basePath = `http://${req.get("host")}/public/uploads/`;
    const image = `${basePath}${filePath}`;

    const updateadmin = await prisma.admin.update({
      where: {
        id
      },
      data: {
        image
      }
    });

    if (!updateadmin) {
      throw new ValidationError("admin not upload image")
    }

    handlerOk(res, 200, updateadmin, "admin upload image successfully")
  } catch (error) {
    next(error)
  }
}





module.exports = {
  adminLogin,
  editImage,
}