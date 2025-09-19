const prisma = require('../config/prismaConfig');
const admin = require('../config/firebase'); // path to your firebase.js

const sendNotification = async (userId, deviceToken, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    token: deviceToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);

    await prisma.notification.create({
      data: {
        userId,
        title,
        description: body
      }
    });


    return response;
  } catch (error) {
    // console.error('Error sending notification:', error);
    // throw error;
    if (error.code === 'messaging/registration-token-not-registered') {
      console.warn(`Device token is not registered. Clearing it for user ${userId}`);
    }

    console.error('Error sending notification:', error);
    throw error;
  }

}


module.exports = sendNotification;
