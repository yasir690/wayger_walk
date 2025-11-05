require("dotenv").config();

module.exports = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
  logger: true,
  debug: true,
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
};
