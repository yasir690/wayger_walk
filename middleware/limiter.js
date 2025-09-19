const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  limit: 4,
  windowMs: 10000,
});

module.exports = limiter;
