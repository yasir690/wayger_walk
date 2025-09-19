const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware//validateRequest");


const adminAuthRouter = require("express").Router();
const adminAuthController = require("../../controllers/admin/adminAuthController");
const { adminLoginSchema } = require("../../schema/admin/auth");
const { verifyAdminToken } = require("../../middleware/auth");
const handleMultiPartData = require("../../middleware/multiPartData");




adminAuthRouter.post(
  "/adminLogin",
  limiter,
  validateRequest(adminLoginSchema),
  adminAuthController.adminLogin
);

adminAuthRouter.post(
  "/editImage",
  limiter,
  verifyAdminToken,
  handleMultiPartData.single("image"),
  adminAuthController.editImage
);





module.exports = adminAuthRouter;