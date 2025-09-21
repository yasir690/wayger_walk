const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");
const userGameRouter = require("express").Router();
const userGameController = require("../../controllers/user/userGameController");
const { verifyUserToken } = require("../../middleware/auth");
const { userCreateGameSchema, userJoinGameSchema, userSearchSchema, userCoinPurchaseSchema, userStepSchema } = require("../../schema/user/game");
const handleMultiPartData = require("../../middleware/multiPartData");



userGameRouter.get(
  "/userSearch",
  limiter,
  verifyUserToken,
  validateRequest(userSearchSchema),
  userGameController.userSearch
);

userGameRouter.post(
  "/createGame",
  limiter,
  verifyUserToken,
  validateRequest(userCreateGameSchema),
  handleMultiPartData.single("image"),
  userGameController.createGame
);

userGameRouter.get(
  "/showGames",
  limiter,
  verifyUserToken,
  userGameController.showGames
);

userGameRouter.get(
  "/myGames",
  limiter,
  verifyUserToken,
  userGameController.myGames
);

userGameRouter.post(
  "/joinGame/:gameId",
  limiter,
  // verifyUserToken,
  validateRequest(userJoinGameSchema),
  userGameController.joinGame
);

userGameRouter.get(
  "/showCoins",
  limiter,
  verifyUserToken,
  userGameController.showCoins
);

userGameRouter.post(
  "/coinPurchase/:coinId",
  limiter,
  verifyUserToken,
  validateRequest(userCoinPurchaseSchema),
  userGameController.coinPurchase
);

userGameRouter.post(
  "/saveUserStep",
  limiter,
  verifyUserToken,
  validateRequest(userStepSchema),
  userGameController.saveUserStep
);



module.exports = userGameRouter;