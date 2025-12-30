const Joi = require("joi");

const adminCreatePrivacyPolicySchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    privacypolicy: Joi.string().required(),
  }),
});

const adminUpdatePrivacyPolicySchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    privacyId: Joi.string().required()
  }),
  body: Joi.object({
    privacypolicy: Joi.string().required(),
  }),
});

const adminCreateTermsConditionSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
  }),
  body: Joi.object({
    termscondition: Joi.string().required(),
  }),
});

const adminUpdateTermsConditionSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    termsId: Joi.string().required()
  }),
  body: Joi.object({
    termscondition: Joi.string().required(),
  }),
});

const adminCreateAboutAppSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
  }),
  body: Joi.object({
    aboutapp: Joi.string().required(),
  }),
});

const adminUpdateAboutAppSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    aboutAppId: Joi.string().required()
  }),
  body: Joi.object({
    aboutapp: Joi.string().required(),
  }),
});

const adminShowGameSchema = Joi.object({
  query: Joi.object({
    gameType:Joi.string().valid("TOURNAMENT", "ONEONONE").optional(),
  }),
  params: Joi.object({
  }),
  body: Joi.object({
  }),
});



const adminCreateWithdrawalRequestSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    amount: Joi.number().positive().required().messages({
      "number.base": "Amount must be a number",
      "number.positive": "Amount must be greater than 0",
      "any.required": "Amount is required"
    }),
    description: Joi.string().optional(),
  }),
});

module.exports = {
  adminCreatePrivacyPolicySchema,
  adminUpdatePrivacyPolicySchema,
  adminCreateTermsConditionSchema,
  adminUpdateTermsConditionSchema,
  adminCreateAboutAppSchema,
  adminUpdateAboutAppSchema,
  adminShowGameSchema,
  adminCreateWithdrawalRequestSchema
}