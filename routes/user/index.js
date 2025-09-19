const userRouter = require("express").Router();
const userAuthRouter = require("./userAuth");
const userNotificationRouter=require("./userNotification");
const userContentRouter=require("./userContent");
const userGameRouter=require("./userGame");


userRouter.use("/auth", userAuthRouter);
userRouter.use("/notification", userNotificationRouter);
userRouter.use("/content", userContentRouter);
userRouter.use("/game", userGameRouter);














module.exports = userRouter;
