const nodemailer = require("nodemailer");
const emailConfig = require("../config/emailConfig");

const transport = nodemailer.createTransport(emailConfig, {
});


const sendEmails = async (to, subject, html, attachments = []) => {
  try {
    console.log("=== sendEmails called ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Attachments count:", attachments.length);

    const message = {
      from: {
        name: process.env.MAIL_FROM_NAME,
        address: process.env.MAIL_USERNAME,
      },
      to,
      subject,
      html,
      attachments,
    };

    const info = await transport.sendMail(message);

    // console.log("✅ Email sent. Message ID:", info.messageId);
    console.log("SMTP response:", info.response);
  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw error;
  }
};

module.exports = sendEmails;
