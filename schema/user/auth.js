const Joi = require("joi");

const userRegisterSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    userEmail: Joi.string().required()
  }),
});


const userVerifyOtpSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    userEmail: Joi.string().required(),
    otp: Joi.string().required(),
    // userPassword: Joi.string()
    //   .min(8)
    //   .max(30)
    //   .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
    //   .optional()
    //   .messages({
    //     'string.pattern.base': 'Password must include uppercase, lowercase, and a number.',
    //   }),
    userName: Joi.string().optional(),
    userDeviceType: Joi.valid("ANDROID", "IOS").optional(),
    userDeviceToken: Joi.string().optional(),
  }),
});

const userForgetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    userEmail: Joi.string().required(),
  }),
});

const userResetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({

    userPassword: Joi.string()
      .min(8)
      .max(30)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'Password must include uppercase, lowercase, and a number.',
      }),
  }),
});


const userLoginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    userEmail: Joi.string().required(),
  }),
});

const userEditProfileSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    userName: Joi.string().optional(),
    userAddress: Joi.string().optional(),
    userHeight: Joi.string().optional(),
    userWeight: Joi.string().optional(),
    userCountry: Joi.string().optional(),
    userStates: Joi.string().optional(),
    userCity: Joi.string().optional(),
    userGender: Joi.string().optional(),



  }),
});

const userResendOtpSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({

    userEmail: Joi.string().required()

  }),
});

const createProfileSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({

    userPhoneNumber: Joi.string().required(),
    userStates: Joi.string().required(),
    userCountry: Joi.string().required(),
    userCity: Joi.string().required(),
    userGender: Joi.string().required(),
    userAddress: Joi.string().required(),
    userHeight: Joi.string().required(),
    userWeight: Joi.string().required(),



  }),
})

const changePasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    currentpassword: Joi.string()
      .min(8)
      .max(30)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'Password must include uppercase, lowercase, and a number.',
      }),
    newpassword: Joi.string()
      .min(8)
      .max(30)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'Password must include uppercase, lowercase, and a number.',
      }),
    confirmPassword: Joi.any()
      .valid(Joi.ref('newpassword'))
      .optional()
      .messages({ 'any.only': 'Confirm password must match password' }),
  }),
});

const socialLoginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().required(),
    accessToken: Joi.string().required(),
    socialType: Joi.string()
      .valid('GOOGLE', 'APPLE')
      .required()
      .messages({
        'any.only': 'socialType must be either GOOGLE or APPLE',
      }),
    deviceType: Joi.string()
      .valid('ANDROID', 'IOS')
      .optional()
      .messages({
        'any.only': 'deviceType must be either ANDROID or IOS',
      }),
    deviceToken: Joi.string().optional(),
  }),
});

module.exports = {
  userRegisterSchema,
  userVerifyOtpSchema,
  userForgetPasswordSchema,
  userResetPasswordSchema,
  userLoginSchema,
  userEditProfileSchema,
  userResendOtpSchema,
  createProfileSchema,
  changePasswordSchema,
  socialLoginSchema
}