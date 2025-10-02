const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware//validateRequest");


const adminWalletRouter = require("express").Router();
const adminWalletController = require("../../controllers/admin/adminWalletController");
const { verifyAdminToken } = require("../../middleware/auth");




adminWalletRouter.get(
  "/showAllAdminTransactions",
  limiter,
  verifyAdminToken,
  adminWalletController.showAllAdminTransactions
);






module.exports = adminWalletRouter;