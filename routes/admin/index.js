const adminRouter = require("express").Router();
const adminAuthRouter = require("./adminAuth");

const adminContentRouter = require("./adminContent");



adminRouter.use("/auth", adminAuthRouter);
adminRouter.use("/content", adminContentRouter);









module.exports = adminRouter;