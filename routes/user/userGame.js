const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");
const userGameRouter = require("express").Router();
const userGameController = require("../../controllers/user/userGameController");
const { verifyUserToken } = require("../../middleware/auth");
const { userCreateGameSchema, userJoinGameSchema, userSearchSchema } = require("../../schema/user/game");
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

userGameRouter.post(
  "/joinGame/:gameId",
  limiter,
  verifyUserToken,
  validateRequest(userJoinGameSchema),
  userGameController.joinGame
);



module.exports = userGameRouter;