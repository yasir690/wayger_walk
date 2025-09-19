require("dotenv").config();
const emailConfig = {
  service: process.env.MAIL_SERVICE,
  pool: true,
  port: 465,
  secure: true,
  logger: true,
  debug: true,
  secureConnection: true,
  host: process.env.MAIL_HOST,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnAuthorized: true,
  },
};

module.exports = emailConfig;
