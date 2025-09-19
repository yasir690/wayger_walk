const { handlerError } = require("../resHandler/responseHandler");
const globalErrorMiddleware = (err, req, res, next) => {
  const statusCode = err.status ?? 500;
  const message = err.message ?? "Something went wrong";
  handlerError(res, statusCode, null, message);
};

module.exports = globalErrorMiddleware;
