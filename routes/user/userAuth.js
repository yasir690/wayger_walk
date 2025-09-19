const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userAuthRouter = require("express").Router();
const userAuthController = require("../../controllers/user/userAuthController");
const { userRegisterSchema, userVerifyOtpSchema, userForgetPasswordSchema, userResetPasswordSchema, userLoginSchema, userEditProfileSchema, userResendOtpSchema, createProfileSchema, changePasswordSchema, socialLoginSchema } = require("../../schema/user/auth");
const { verifyUserToken } = require("../../middleware/auth");
const handleMultiPartData = require("../../middleware/multiPartData");

userAuthRouter.post(
  "/userRegister",
  limiter,
  validateRequest(userRegisterSchema),
  userAuthController.userRegister
);

userAuthRouter.post(
  "/userVerifyOtp",
  limiter,
  validateRequest(userVerifyOtpSchema),
  userAuthController.userVerifyOtp
);

userAuthRouter.post(
  "/userLogin",
  limiter,
  validateRequest(userLoginSchema),
  userAuthController.userLogin
);

userAuthRouter.post(
  "/userForgetPassword",
  limiter,
  validateRequest(userForgetPasswordSchema),
  userAuthController.userForgetPassword
);

userAuthRouter.put(
  "/userResetPassword",
  limiter,
  verifyUserToken,
  validateRequest(userResetPasswordSchema),
  userAuthController.userResetPassword
);

userAuthRouter.post(
  "/resendOtp",
  limiter,
  validateRequest(userResendOtpSchema),
  userAuthController.resendOtp
);

userAuthRouter.post(
  "/createProfile",
  limiter,
  verifyUserToken,
  validateRequest(createProfileSchema),
  handleMultiPartData.single("image"),
  userAuthController.createProfile
);


userAuthRouter.put(
  "/userEditProfile",
  limiter,
  verifyUserToken,
  validateRequest(userEditProfileSchema),
  handleMultiPartData.single("image"),
  userAuthController.userEditProfile
);

userAuthRouter.post(
  "/userLogOut",
  limiter,
  verifyUserToken,
  userAuthController.userLogOut
);

userAuthRouter.delete(
  "/userDeleteAcccount",
  limiter,
  verifyUserToken,
  userAuthController.userDeleteAccount
);

userAuthRouter.get(
  "/getMe",
  limiter,
  verifyUserToken,
  userAuthController.getMe
);

userAuthRouter.put(
  "/changePassword",
  limiter,
  verifyUserToken,
  validateRequest(changePasswordSchema),
  userAuthController.changePassword
);

userAuthRouter.post(
  "/socialLogin",
  limiter,
  verifyUserToken,
    validateRequest(socialLoginSchema),

  userAuthController.socialLogin
);






module.exports = userAuthRouter;
