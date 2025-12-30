const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware//validateRequest");


const adminWalletRouter = require("express").Router();
const adminWalletController = require("../../controllers/admin/adminWalletController");
const { verifyAdminToken } = require("../../middleware/auth");
const { adminCreateWithdrawalRequestSchema } = require("../../schema/admin/content");




adminWalletRouter.get(
  "/showAllAdminTransactions",
  // limiter,
  verifyAdminToken,
  adminWalletController.showAllAdminTransactions
);

adminWalletRouter.post(
  "/createWithdrawalRequest",
  // limiter,
  verifyAdminToken,
  validateRequest(adminCreateWithdrawalRequestSchema),
  adminWalletController.createWithdrawalRequest
);

module.exports = adminWalletRouter;