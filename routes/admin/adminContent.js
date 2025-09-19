const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware//validateRequest");


const adminContentRouter = require("express").Router();
const adminContentController = require("../../controllers/admin/adminContentController");
const { verifyAdminToken } = require("../../middleware/auth");
const { adminCreatePrivacyPolicySchema, adminUpdatePrivacyPolicySchema, adminCreateTermsConditionSchema, adminUpdateTermsConditionSchema,adminUpdateAboutAppSchema, adminCreateAboutAppSchema } = require("../../schema/admin/content");

adminContentRouter.get("/showAllUsers",
  // limiter,
  verifyAdminToken,
  adminContentController.showAllUsers
);

adminContentRouter.get("/countUsers",
  // limiter,
  verifyAdminToken,
  adminContentController.countUsers
);

adminContentRouter.get("/androidUsers",
  // limiter,
  verifyAdminToken,
  adminContentController.androidUsers
);

adminContentRouter.get("/iosUsers",
  // limiter,
  verifyAdminToken,
  adminContentController.iosUsers
);


adminContentRouter.post("/createPrivacyPolicy",
  limiter,
  verifyAdminToken,
  validateRequest(adminCreatePrivacyPolicySchema),
  adminContentController.createPrivacyPolicy
);

adminContentRouter.get("/showPrivacyPolicy",
  limiter,
  verifyAdminToken,
  adminContentController.showPrivacyPolicy
);

adminContentRouter.put("/updatePrivacyPolicy/:privacyId",
  limiter,
  verifyAdminToken,
  validateRequest(adminUpdatePrivacyPolicySchema),
  adminContentController.updatePrivacyPolicy
);

adminContentRouter.post("/createTermsAndCondition",
  limiter,
  verifyAdminToken,
  validateRequest(adminCreateTermsConditionSchema),
  adminContentController.createTermsAndCondition
);

adminContentRouter.get("/showTermsAndCondition",
  limiter,
  verifyAdminToken,
  adminContentController.showTermsAndCondition
);

adminContentRouter.put("/updateTermsAndCondition/:termsId",
  limiter,
  verifyAdminToken,
  validateRequest(adminUpdateTermsConditionSchema),
  adminContentController.updateTermsAndCondition
);

adminContentRouter.post("/createAboutApp",
  limiter,
  verifyAdminToken,
  validateRequest(adminCreateAboutAppSchema),
  adminContentController.createAboutApp
);

adminContentRouter.get("/showAboutApp",
  limiter,
  verifyAdminToken,
  adminContentController.showAboutApp
);

adminContentRouter.put("/updateAboutApp/:aboutAppId",
  limiter,
  verifyAdminToken,
  validateRequest(adminUpdateAboutAppSchema),
  adminContentController.updateAboutApp
);

adminContentRouter.get("/showAllUsersFeedBack",
  limiter,
  verifyAdminToken,
  adminContentController.showAllUsersFeedBack
);



module.exports = adminContentRouter;