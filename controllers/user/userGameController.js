const prisma = require("../../config/prismaConfig");
const { ValidationError, NotFoundError, BadRequestError, ConflictError } = require("../../resHandler/CustomError");
const { handlerOk } = require("../../resHandler/responseHandler");
const { generateOtp } = require("../../utils/generateOtp");
const { v4: uuidv4 } = require('uuid');
const path = require("path");
const uploadFileWithFolder = require("../../utils/s3Upload");
const { gameStatus, notificationType } = require("@prisma/client");
const { gameStatusConstants, notificationConstants } = require("../../constants/constants");

const userSearch = async (req, res, next) => {
  try {
    const { userName } = req.query;
    const { id } = req.user;
    const users = await prisma.user.findMany({
      where: {
        userName: {
          contains: userName,
        },
        NOT: {
          id: id
        }
      }
    });

    if (users.length === 0) {
      // throw new NotFoundError("users not found")

      return handlerOk(res, 200, null, "users not found")
    }

    return handlerOk(res, 200, users, "users found successfully")

  } catch (error) {
    next(error)
  }
}


const createGame = async (req, res, next) => {
  try {
    const { id, userName } = req.user;
    const {
      price,
      startDate,
      endDate,
      gameType,
      gamedescription,
      gameTitle,
      isReminder,
      isPrivate,
      inviteUsers = '[]'
    } = req.body;

    const file = req.file;

    // Fetch user and their coins
    const finduser = await prisma.user.findUnique({
      where: { id },
      include: { Coins: true },
    });

    const userCoinsRecord = finduser?.Coins?.[0];
    const userCoins = userCoinsRecord?.coins || 0;

    if (Number(price) > userCoins) {
      throw new ConflictError("You do not have enough coins to play this game.");
    }

    const otp = generateOtp();

    // Handle image upload
    let s3ImageUrl;
    if (file) {
      const fileBuffer = file.buffer;
      const folder = 'uploads';
      const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      const contentType = file.mimetype || 'application/octet-stream';
      s3ImageUrl = await uploadFileWithFolder(fileBuffer, filename, contentType, folder);
    }

    const privateGame = gameType === 'ONEONONE' ? true : isPrivate === 'true';
    const parsedInviteUsers = typeof inviteUsers === 'string' ? JSON.parse(inviteUsers) : inviteUsers;


    // Condition: If private game and no invited users, don't create the game
    if (privateGame && parsedInviteUsers.length === 0) {
      throw new ValidationError("Private games must have at least one invited user.");
    }

    if (privateGame && parsedInviteUsers.length > 1) {
      throw new ValidationError("Private games only have one invited user.");
    }

    // Add creator to invited list
    const allInviteUserIds = new Set(parsedInviteUsers);
    allInviteUserIds.add(id);

    // Validate users
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: Array.from(allInviteUserIds) } },
      select: { id: true },
    });

    const existingUserIds = new Set(existingUsers.map(user => user.id));
    const invalidUserIds = Array.from(allInviteUserIds).filter(userId => !existingUserIds.has(userId));

    if (invalidUserIds.length > 0) {
      throw new ValidationError(`Invalid user IDs: ${invalidUserIds.join(', ')}`);
    }

    const inviteConnectData = Array.from(existingUserIds).map(userId => ({ id: userId }));

    // Create player statuses
    const gamePlayerStatuses = Array.from(existingUserIds).map(userId => ({
      userId,
      status: (!privateGame || userId === id) ? 'ACCEPTED' : 'PENDING',
    }));

    // Create game
    const game = await prisma.game.create({
      data: {
        createdById: id,
        gamePrice: Number(price),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        gameType,
        gameDescription: gamedescription,
        gameTitle,
        gameCode: otp,
        isPrivate: privateGame,
        ...(s3ImageUrl && { image: s3ImageUrl }),
        ...(typeof isReminder !== 'undefined' && {
          isReminder: isReminder === 'true',
        }),
        invitedFriends: {
          connect: inviteConnectData
        },
        GamePlayerStatus: {
          create: gamePlayerStatuses
        }
      },
      include: {
        GamePlayerStatus: {
          include: {
            user: true
          }
        },
        invitedFriends: true
      }
    });

    if (!game) {
      throw new ValidationError("Game creation failed.");
    }

    // Send notifications to invited users (excluding creator)
    const externalInviteUserIds = parsedInviteUsers.filter(userId => userId !== id && existingUserIds.has(userId));

    if (externalInviteUserIds.length > 0) {
      const notifications = externalInviteUserIds.map(userId => ({
        userId,
        notificationType: notificationConstants.INVITATION,
        gameId: game.id,
        title: "Game Invitation",
        description: `${userName} invited you to join the game "${gameTitle}"`,
      }));

      await prisma.notification.createMany({
        data: notifications,
        skipDuplicates: true,
      });
    }

    // Deduct coins from creator
    const newCoinBalance = userCoins - game.gamePrice;

    await prisma.coins.update({
      where: {
        id: userCoinsRecord.id,
      },
      data: {
        coins: newCoinBalance
      }
    });

    handlerOk(res, 201, game, "Game created successfully");

  } catch (error) {
    next(error);
  }
};


const showGames = async (req, res, next) => {
  try {
    const { gameType } = req.query;
    console.log(gameType);

    const { id } = req.user;
    const now = new Date();

    console.log(now);


    const games = await prisma.game.findMany({
      where: {
        gameType: gameType,
        isPrivate: false,
        NOT: [
          { createdById: id },
          { invitedFriends: { some: { id: id } } }
        ],
        OR: [
          {
            startDate: { gte: now },  // Future games
          },
          {
            startDate: { lte: now },  // Ongoing games (started already)
            endDate: { gte: now },    // Ongoing games (not ended yet)
            isEnded: false,           // Make sure the game is still ongoing
          },
        ],
      },
      include: {
        totalPlayers: true,
        invitedFriends: true
      }
    });


    if (games.length > 0) {
      games.forEach((game) => {
        if (game.startDate < now && game.endDate > now && !game.isEnded) {
          game.gameStatus = gameStatusConstants.ONGOINGAME;  // Ongoing game
        } else if (game.startDate >= now) {
          game.gameStatus = gameStatusConstants.FUTUREGAME;   // Future game
        }
      });
    }


    if (games.length === 0) {
      // throw new NotFoundError("no game found");

      return handlerOk(res, 200, null, "no game found")


    }

    return handlerOk(res, 200, games, "games found successfully");

  } catch (error) {
    next(error)
  }
}



const myGames = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { gameType } = req.query;
    const now = new Date();

    console.log(now);

    // Base condition: creator OR has ACCEPTED GamePlayerStatus
    const baseCondition = {
      OR: [
        { createdById: id },
        {
          GamePlayerStatus: {
            some: {
              userId: id,
              status: 'ACCEPTED',
            },
          },
        },
      ],
    };

    // Apply gameType filters
    let where = { AND: [baseCondition] };

    if (gameType === 'PRESENT') {
      where = { AND: [baseCondition, { startDate: { lte: now } }] };
    } else if (gameType === 'PAST') {
      where = { AND: [baseCondition, { endDate: { lt: now } }] };
    } else if (gameType === 'FUTURE') {
      where = { AND: [baseCondition, { startDate: { gt: now } }] };
    }

    const candidates = await prisma.game.findMany({
      where,
      include: {
        invitedFriends: true,
        GamePlayerStatus: {
          include: { user: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    console.log(candidates);

    // JS-side classification (handles overnight dates)
    const games = candidates.filter(g => {
      const start = new Date(g.startDate);
      const endRaw = g.endDate ? new Date(g.endDate) : null;

      const end = endRaw && endRaw < start
        ? new Date(endRaw.getTime() + 24 * 60 * 60 * 1000)
        : endRaw;

      if (gameType === 'PRESENT') {
        return start <= now && (end ? now <= end : true);
      }
      if (gameType === 'PAST') {
        return end ? end < now : false;
      }
      if (gameType === 'FUTURE') {
        return start > now;
      }
      return true;
    });

    if (games.length === 0) {
      return handlerOk(res, 200, null, "no game found");
    }

    return handlerOk(res, 200, games, "games found successfully");

  } catch (error) {
    next(error);
  }
};


const joinGame = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { gameId } = req.params;

    // Get user with coins
    const finduser = await prisma.user.findUnique({
      where: { id },
      include: { Coins: true },
    });

    // Get game with current players and player statuses
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        GamePlayerStatus: true,
        totalPlayers: true,
      },
    });

    if (!game) {
      throw new NotFoundError("Game not found");
    }

    const userCoinsRecord = finduser.Coins?.[0];
    const userCoins = userCoinsRecord?.coins || 0;

    if (game.gamePrice > userCoins) {
      throw new ConflictError("You do not have enough coins to play this game.");
    }

    if (game.createdById === id) {
      throw new ValidationError("You cannot join your own game");
    }

    // Check if user already has a status for this game
    const existingStatus = game.GamePlayerStatus.find(ps => ps.userId === id);

    if (existingStatus && existingStatus.status === 'ACCEPTED') {
      throw new ValidationError("You have already joined this game");
    }

    // Check ONEONONE max players = 2 and accepted players count
    const acceptedPlayers = game.GamePlayerStatus.filter(ps => ps.status === 'ACCEPTED');
    if (game.gameType === "ONEONONE" && acceptedPlayers.length >= 2) {
      throw new ValidationError("This one-on-one game is already full");
    }

    // Update or create the player status as ACCEPTED
    if (existingStatus) {
      // Update existing status to ACCEPTED
      await prisma.gamePlayerStatus.update({
        where: { id: existingStatus.id },
        data: { status: 'ACCEPTED' },
      });
    } else {
      // Create new player status with ACCEPTED
      await prisma.gamePlayerStatus.create({
        data: {
          userId: id,
          gameId: gameId,
          status: 'ACCEPTED',
        },
      });
    }

    // Recalculate game price based on accepted players + this user
    const newAcceptedCount = acceptedPlayers.length + (existingStatus && existingStatus.status === 'ACCEPTED' ? 0 : 1);
    const updatedGamePrice = game.gamePrice * newAcceptedCount;

    // Update game: currentPrice, connect user to totalPlayers and invitedFriends if needed
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        currentPrice: updatedGamePrice,
        totalPlayers: { connect: { id } },
        invitedFriends: { connect: { id } },
      },
      include: {
        invitedFriends: true,
      },
    });

    // Deduct coins from user
    const newCoinBalance = userCoins - game.gamePrice;
    await prisma.coins.update({
      where: { id: userCoinsRecord.id },
      data: { coins: newCoinBalance },
    });

    // Delete notifications related to this game for the user (optional, adjust if needed)
    await prisma.notification.deleteMany({
      where: {
        gameId: gameId,
        userId: id,
      },
    });

    handlerOk(res, 200, updatedGame, "Game joined successfully");

  } catch (error) {
    next(error);
  }
};


const showCoins = async (req, res, next) => {
  try {
    const findcoins = await prisma.coinPlan.findMany();

    if (findcoins.length === 0) {
      throw new NotFoundError("coins not found")
    }

    handlerOk(res, 200, findcoins, "coins found successfully")
  } catch (error) {
    next(error)
  }
}

const coinPurchase = async (req, res, next) => {
  try {

    const { coinId } = req.params;
    const { id } = req.user;

    const findcoinplan = await prisma.coinPlan.findFirst({
      where: {
        id: coinId
      }
    });

    if (!findcoinplan) {
      throw new NotFoundError("coins plan not found")
    }

    const userCoins = await prisma.coins.findUnique({
      where: {
        userId: id
      }
    });

    console.log(userCoins, 'user coin');

    if (!userCoins) {
      await prisma.coins.create({
        data: {
          userId: id,
          coins: Number(findcoinplan.coins)
        }
      })
    } else {
      await prisma.coins.update({
        where: {
          userId: id
        },
        data: {
          coins: userCoins.coins + Number(findcoinplan.coins)
        }
      });
    }



    await prisma.coinPurchase.create({
      data: {
        userId: id,
        planId: findcoinplan.id,
        amountPaid: findcoinplan.price,
        coinsAdded: findcoinplan.coins

      }
    })

    handlerOk(res, 200, null, "coin purchase successfully")


  } catch (error) {
    next(error)
  }
}

const saveUserStep = async (req, res, next) => {
  try {
    const stepsList = req.body;
    const { id } = req.user;

    if (!Array.isArray(stepsList) || stepsList.length === 0) {
      throw new ValidationError("body must be a non-empty array of step objects");
    }

    const ops = stepsList.map((item) => {

      const step = Number(item.step);
      const distance = Number(item.distance);
      const sources = Array.isArray(item.sources) ? item.sources.map(String) : [];
      const dateObj = new Date(item.date); // cast to Date

      console.log(dateObj);


      return prisma.userStep.upsert({
        where: {
          userId_date: {
            userId: id,
            date: dateObj
          },
        },
        update: {
          steps: step,
          distance: distance,
          sources: sources,
        },
        create: {
          steps: step,
          distance: distance,
          sources: sources,
          date: dateObj,
          userId: id,
        },
      });
    });

    // Atomic write: all or nothing
    const saved = await prisma.$transaction(ops);

    if (!saved) {
      throw new ValidationError("step not save")
    }

    handlerOk(res, 200, saved, "step save successfully");

  } catch (error) {
    next(error)
  }
}

const WinningDetails = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    // Fetch game details, including winner and invitedFriends
    const findgame = await prisma.game.findUnique({
      where: {
        id: gameId
      },
      select: {
        winner: true, // Include winner (relation)
        startDate: true, // Select startDate (scalar field)
        endDate: true, // Select endDate (scalar field)
        invitedFriends: true, // Include invitedFriends (relation)
      }
    });

    if (!findgame) {
      throw new NotFoundError("Game not found");
    }

    console.log(findgame, 'game');


    const { startDate, endDate, winner, invitedFriends } = findgame;

    console.log(startDate, 'startdate');
    console.log(endDate, 'enddate');



    // Fetch steps data for each invited user during the game period (between startDate and endDate)
    const usersteps = await prisma.userStep.findMany({
      where: {
        userId: { in: invitedFriends.map(player => player.id) },
        date: {
          gte: startDate, // Only get steps between start and end dates
          lte: endDate
        }
      },
      select: {
        userId: true,
        steps: true
      }
    });

    // Prepare a map to store the steps for each user
    const userStepMap = usersteps.reduce((acc, userStep) => {
      acc[userStep.userId] = userStep.steps;
      return acc;
    }, {});

    // Ensure winner's steps are included
    const winnerSteps = userStepMap[winner.id] || 0;

    // Create response data with each invited player's steps, ensuring that non-participants are excluded
    const responseData = invitedFriends.map(player => {
      // Include only participants' steps (players in the invitedFriends list)
      return {
        userId: player.id,
        userName: player.userName, // Assuming the `User` model has `userName` field
        steps: userStepMap[player.id] || 0, // Get steps or default to 0 if no data exists
      };
    });

    // Add the winning user's data to the response
    const winnerData = {
      userId: winner.id,
      userName: winner.userName,
      steps: winnerSteps,
    };

    // Prepare final response with winner and user steps
    const statsData = {
      gameId: gameId,
      winner: winnerData,
      userSteps: responseData,  // Steps for all invited participants in the game
    };

    // Send the response with the correct data
    handlerOk(res, 200, statsData, "Winning details retrieved successfully");

  } catch (error) {
    next(error);
  }
};




module.exports = {
  createGame,
  showGames,
  joinGame,
  userSearch,
  showCoins,
  coinPurchase,
  saveUserStep,
  myGames,
  WinningDetails
}