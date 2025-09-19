const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");
const userNotificationRouter = require("express").Router();
const userNotificationController = require("../../controllers/user/userNotificationController");
const { userNotificationReadSchema, userAllNotificationSchema } = require("../../schema/user/notification");
const { verifyUserToken } = require("../../middleware/auth");


// userNotificationRouter.post(
//   "/createNotification",
//   limiter,
//   verifyUserToken,
//   userNotificationController.createNotification
// );


userNotificationRouter.get(
  "/showAllNotification",
  limiter,
  verifyUserToken,
  validateRequest(userAllNotificationSchema),
  userNotificationController.showAllNotification
);

userNotificationRouter.put(
  "/readNotification/:notificationId",
  limiter,
  verifyUserToken,
  validateRequest(userNotificationReadSchema),
  userNotificationController.readNotification
);

userNotificationRouter.put(
  "/onAndOffNotification",
  limiter,
  verifyUserToken,
  userNotificationController.onAndOffNotification
);

module.exports = userNotificationRouter;