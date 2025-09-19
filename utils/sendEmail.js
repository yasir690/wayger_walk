const nodemailer = require("nodemailer");
const emailConfig = require("../config/emailConfig");
const transport = nodemailer.createTransport(emailConfig);

const sendEmails = async (to, subject, content, next) => {
  try {
    const message = {
      from: {
        name: process.env.MAIL_FROM_NAME,
        address: process.env.MAIL_USERNAME,
      },
      to: to,
      subject: subject,
      html: content,
    };

    await transport.sendMail(message);

    if (typeof next === "function") {
      next();
    }
  } catch (error) {
    console.error("Email sending error:", error);

    if (typeof next === "function") {
      next(error);
    }
  }
};

module.exports = sendEmails;
