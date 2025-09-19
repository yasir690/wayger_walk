const { BadRequestError } = require("../resHandler/CustomError");

const isFileExists = (message, multiple = false) => {
  return (req, res, next) => {
    try {
      if (multiple) {
        if (!req.files || Object.keys(req.files).length === 0) {
          throw new BadRequestError(message);
        }
      } else {
        if (!req.file) {
          throw new BadRequestError(message);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = isFileExists;
