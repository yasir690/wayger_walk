const Joi = require("joi");

const adminLoginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
    deviceToken: Joi.string().optional()
  }),
});

module.exports = {
  adminLoginSchema

}