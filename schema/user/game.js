const Joi = require("joi");

const userSearchSchema = Joi.object({
  query: Joi.object({
    userName: Joi.string().required(),
  }),
  params: Joi.object({
  }),
  body: Joi.object({

  }),
});

const userCreateGameSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    price: Joi.number().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    isReminder: Joi.string().optional(),
    totalPlayers: Joi.number().required(),
    totalSteps: Joi.number().required(),
    gameType: Joi.string().required(),
    gamedescription: Joi.string().required(),
    gameTitle: Joi.string().required(),
    gameCode: Joi.string().required(),
    gameDuration: Joi.string().required(),
    inviteUsers: Joi.array().items(Joi.string()).optional(),
  }),
});

const userJoinGameSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    gameId: Joi.string().required(),
  }),
  body: Joi.object({
    gameCode: Joi.string().required(),
    userIds: Joi.array().items(Joi.string()).optional()
  }),
});

const userCoinPurchaseSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    coinId: Joi.string().required(),
  }),
  body: Joi.object({
  }),
});

const userStepSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
  }),
  body: Joi.object({
    step:Joi.number().required(),
    distance:Joi.number().required(),
    sources:Joi.array().items(Joi.string()).required(),
    date:Joi.date().required()
  }),
});

module.exports = {
  userCreateGameSchema,
  userJoinGameSchema,
  userSearchSchema,
  userCoinPurchaseSchema,
  userStepSchema
};