const adminRouter = require("express").Router();
const adminAuthRouter = require("./adminAuth");

const adminContentRouter = require("./adminContent");
const adminWalletRouter = require("./adminWallet");


adminRouter.use("/auth", adminAuthRouter);
adminRouter.use("/content", adminContentRouter);
adminRouter.use("/wallet", adminWalletRouter);










module.exports = adminRouter;