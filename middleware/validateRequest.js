const { BadRequestError } = require("../resHandler/CustomError");

const formatJoiErrors = (JoiError) => {
  console.log(JoiError, "JoiError");

  return JoiError.map((message) => {
    console.log(message, "message");

    // Replace the parameter messages
    let cleanedMessage = message
      .replace(/"params\.(\w+)"/, "$1") // Replace params
      .replace(/"body\.(\w+)"/, "$1") // Replace body
      .replace(/"query\.(\w+)"/, "$1"); // Replace query

    return cleanedMessage;
  });
};

const validateRequest = (schema) => (req, res, next) => {
  const { body, params, query } = req;

  try {
    const { error } = schema.validate(
      { body, params, query },
      { abortEarly: false }
    );
    if (error) {
      // const errorMessage = error.details.map((err) => err.message);

      // const formattedErrors = formatJoiErrors(errorMessage);

      // Get the first error message
      const errorMessage = error.details[0].message;

      // Optionally, you can format the error message if needed
      const formattedError = formatJoiErrors([errorMessage]);

      const errorString = formattedError.toString();

      throw new BadRequestError(errorString);
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateRequest;
