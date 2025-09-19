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
  }),
});

const userJoinGameSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    gameId: Joi.string().required(),
  }),
  body: Joi.object({
    gameCode: Joi.string().required(),
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

module.exports = {
  userCreateGameSchema,
  userJoinGameSchema,
  userSearchSchema,
  userCoinPurchaseSchema
};