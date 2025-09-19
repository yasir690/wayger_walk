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



module.exports = {
  adminCreatePrivacyPolicySchema,
  adminUpdatePrivacyPolicySchema,
  adminCreateTermsConditionSchema,
  adminUpdateTermsConditionSchema,
  adminCreateAboutAppSchema,
  adminUpdateAboutAppSchema
  
}