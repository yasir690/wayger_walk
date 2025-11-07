const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");
const userGameRouter = require("express").Router();
const userGameController = require("../../controllers/user/userGameController");
const { verifyUserToken } = require("../../middleware/auth");
const { userCreateGameSchema, userJoinGameSchema, userSearchSchema, userCoinPurchaseSchema, userStepSchema, userMyGameSchema, userShowGameSchema, userWinningDetailsSchema, userSendStepsSchema } = require("../../schema/user/game");
const handleMultiPartData = require("../../middleware/multiPartData");



userGameRouter.get(
  "/userSearch",
  // limiter,
  verifyUserToken,
  validateRequest(userSearchSchema),
  userGameController.userSearch
);

userGameRouter.post(
  "/createGame",
  // limiter,
  verifyUserToken,
  validateRequest(userCreateGameSchema),
  handleMultiPartData.single("image"),
  userGameController.createGame
);

userGameRouter.get(
  "/showGames",
  // limiter,
  verifyUserToken,
  validateRequest(userShowGameSchema),
  userGameController.showGames
);

userGameRouter.get(
  "/myGames",
  // limiter,
  verifyUserToken,
  validateRequest(userMyGameSchema),
  userGameController.myGames
);

userGameRouter.post(
  "/joinGame/:gameId",
  // limiter,
  verifyUserToken,
  validateRequest(userJoinGameSchema),
  userGameController.joinGame
);

userGameRouter.get(
  "/showCoins",
  // limiter,
  verifyUserToken,
  userGameController.showCoins
);

userGameRouter.post(
  "/coinPurchase/:coinId",
  // limiter,
  verifyUserToken,
  validateRequest(userCoinPurchaseSchema),
  userGameController.coinPurchase
);

userGameRouter.post(
  "/saveUserStep",
  // limiter,
  verifyUserToken,
  validateRequest(userStepSchema),
  userGameController.saveUserStep
);

userGameRouter.get(
  "/showUserStep",
  // limiter,
  verifyUserToken,
  userGameController.showUserStep
);

userGameRouter.post(
  "/sendUserSteps",
  // limiter,
  verifyUserToken,
  // validateRequest(userSendStepsSchema),
  userGameController.sendUserSteps
);

// userGameRouter.delete(
//   "/deleteUserSteps",
//   // limiter,
//   verifyUserToken,
//   userGameController.deleteUserSteps
// );

userGameRouter.get(
  "/WinningDetails/:gameId",
  // limiter,
  verifyUserToken,
  validateRequest(userWinningDetailsSchema),
  userGameController.WinningDetails
);

// userGameRouter.get(
//   "/teststep",
//   // limiter,
//   verifyUserToken,
//   // validateRequest(userWinningDetailsSchema),
//   userGameController.teststep
// );



module.exports = userGameRouter;