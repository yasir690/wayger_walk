const Joi = require("joi");

const userSubmitFeedBackSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    subject: Joi.string().required(),
    message: Joi.string().required()
  }),
});


module.exports=userSubmitFeedBackSchema;