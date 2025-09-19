const handlerOk = async (res, status, data, message) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const handlerError = async (res, status, data, message) => {
  return res.status(status).json({
    success: false,
    message,
    data,
  });
};

module.exports = { handlerOk, handlerError };
