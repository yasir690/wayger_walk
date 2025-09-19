const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");
const userContentRouter = require("express").Router();
const userContentController = require("../../controllers/user/userContentController");
const { verifyUserToken } = require("../../middleware/auth");
const userSubmitFeedBackSchema = require("../../schema/user/content");
const handleMultiPartData = require("../../middleware/multiPartData");



userContentRouter.get(
  "/userPrivacyPolicy",
  limiter,
  verifyUserToken,
  userContentController.userPrivacyPolicy
);

userContentRouter.get(
  "/userTermsCondition",
  limiter,
  verifyUserToken,
  userContentController.userTermsCondition
);

userContentRouter.get(
  "/userAboutApp",
  limiter,
  verifyUserToken,
  userContentController.userAboutApp
);

userContentRouter.post(
  "/userSubmitFeedBack",
  limiter,
  verifyUserToken,
  validateRequest(userSubmitFeedBackSchema),
  handleMultiPartData.array("images"),
  userContentController.userSubmitFeedBack
);


module.exports = userContentRouter;