class myError extends Error {
    constructor(message, status) {
      super(message);
      this.message = message;
      this.status = status;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class ConflictError extends myError {
    constructor(message) {
      super(message, 409);
    }
  }
  
  class ValidationError extends myError {
    constructor(message) {
      super(message, 422);
    }
  }
  class NotFoundError extends myError {
    constructor(message) {
      super(message, 404);
    }
  }
  
  class UnAuthorizedError extends myError {
    constructor(message) {
      super(message, 401);
    }
  }
  
  class BadRequestError extends myError {
    constructor(message) {
      super(message, 400);
    }
  }
  
  class ForbiddenError extends myError {
    constructor(message) {
      super(message, 403);
    }
  }
  
  module.exports = {
    ConflictError,
    ValidationError,
    NotFoundError,
    UnAuthorizedError,
    BadRequestError,
    ForbiddenError
  };
  