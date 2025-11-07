const prisma = require("../../config/prismaConfig");
const { ValidationError, NotFoundError, BadRequestError, ConflictError } = require("../../resHandler/CustomError");
const { handlerOk } = require("../../resHandler/responseHandler");
const { generateOtp } = require("../../utils/generateOtp");
const { v4: uuidv4 } = require('uuid');
const path = require("path");
const uploadFileWithFolder = require("../../utils/s3Upload");
const { gameStatus, notificationType } = require("@prisma/client");
const { gameStatusConstants, notificationConstants } = require("../../constants/constants");
const dayRangeUTC = require("../../utils/dayrangeutc");
const emailTemplates = require("../../utils/emailTemplate");
const fs = require('fs');
const sendEmails = require("../../utils/sendEmail");

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
        currentPrice: Number(price),
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

const showUserStep=async (req,res,next) => {
  try {
    const {id}=req.user;

    const finduser=await prisma.userStep.findMany({where:{userId:id}});

    if(finduser.length===0){
      throw new NotFoundError("user steps not found")
    }

    handlerOk(res,200,finduser,"user steps found succesfully");


  } catch (error) {
    next(error)
  }
}

const sendUserSteps = async (req, res, next) => {
  let filePath = null;

  try {
    // const { email } = req.body;
    const { id,email } = req.user;

    // 1️⃣ Fetch user steps
    const usersteps = await prisma.userStep.findMany({ where: { userId: id } });

    if (!usersteps.length) throw new NotFoundError("User steps not found");

    console.log("Fetched user steps:", usersteps.length);

    // 2️⃣ Create temp JSON file
    const fileName = `user_steps_${id}.txt`;
    filePath = path.join(__dirname, "../temp", fileName);

    console.log(filePath,'filepath');
    

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(usersteps, null, 2));
    console.log(`Temp file created: ${filePath}`);

    // 3️⃣ Read file into buffer
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`File read into buffer: ${fileBuffer.length} bytes`);

    // 4️⃣ Prepare email
    const emailData = {
      subject: "Wayger Walk - Your Steps Data",
      html: emailTemplates.sendFile(fileName),
    };

    // 5️⃣ Send email with attachment
    console.log("Sending email with attachment...");

    await sendEmails(email, emailData.subject, emailData.html, [
  {
    filename: fileName,
    path: filePath,          // <-- Use path directly
    contentType: "application/json",
  },
]);

    console.log("✅ Email sent successfully!");

    // 6️⃣ Response
    handlerOk(res, 200, null, "User steps sent successfully to your email");
  } catch (error) {
    console.error("❌ Error in sendUserSteps controller:", error);
    next(error);
  } finally {
    // 7️⃣ Clean up temp file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("Temp file deleted:", filePath);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }
  }
};


const WinningDetails = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        startDate: true,
        endDate: true,
        winner: { select: { id: true, userName: true } },
        invitedFriends: { select: { id: true, userName: true } },
      }
    });

    if (!game) throw new NotFoundError("Game not found");

    const { startDate, endDate, winner, invitedFriends } = game;

    // Participants = invited friends (+ winner just in case)
    const ids = new Set(invitedFriends.map(u => u.id));
    if (winner?.id) ids.add(winner.id);
    const userIds = [...ids];

    if (!userIds.length) {
      return handlerOk(res, 200, { gameId, winner: null, userSteps: [] }, "Winning details retrieved successfully");
    }

    // Same day-granular UTC window as cron
    const { startDayUTC, endDayExclusiveUTC } = dayRangeUTC(startDate, endDate);

    const totals = await prisma.userStep.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        date: { gte: startDayUTC, lt: endDayExclusiveUTC },
      },
      _sum: { steps: true }
    });

    const stepMap = new Map(totals.map(t => [t.userId, t._sum.steps || 0]));

    const userSteps = invitedFriends
      .map(u => ({
        userId: u.id,
        userName: u.userName,
        steps: stepMap.get(u.id) ?? 0
      }))
      .sort((a, b) => b.steps - a.steps);

    const winnerData = winner
      ? { userId: winner.id, userName: winner.userName, steps: stepMap.get(winner.id) ?? 0 }
      : null;

    handlerOk(res, 200, { gameId, winner: winnerData, userSteps }, "Winning details retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// const deleteUserSteps=async (req,res,next) => {
//   try {
//     const {id}=req.user;

//     const deleteusersteps=await prisma.userStep.deleteMany({
//       where:{
//         userId:id
//       }
//     });

//     if(!deleteusersteps){
//       throw new ValidationError("user steps delete successfully")
//     }

//     handlerOk(res,200,null,"user steps deleted succesfully");
//   } catch (error) {
//     next(error)
//   }
// }




module.exports = {
  createGame,
  showGames,
  joinGame,
  userSearch,
  showCoins,
  coinPurchase,
  saveUserStep,
  myGames,
  WinningDetails,
  showUserStep,
  sendUserSteps,
  // deleteUserSteps
}