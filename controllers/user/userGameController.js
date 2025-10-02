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


// const createGame = async (req, res, next) => {
//     try {
//         const { id, userName } = req.user; // Creator's ID and Name
//         const {
//             price, startDate, endDate,
//             gameType, gamedescription, gameTitle,
//             isReminder, isPrivate, inviteUsers = '[]'
//         } = req.body;

//         const file = req.file;

//         // Fetch user and their coins
//         const finduser = await prisma.user.findUnique({
//             where: { id },
//             include: { Coins: true },
//         });

//         const userCoinsRecord = finduser?.Coins?.[0];
//         const userCoins = userCoinsRecord?.coins || 0;

//         if (Number(price) > userCoins) {
//             throw new ConflictError("You do not have enough coins to play this game.");
//         }

//         const otp = generateOtp();

//         // ===== Handle optional image upload =====
//         let s3ImageUrl;
//         if (file) {
//             const fileBuffer = file.buffer;
//             const folder = 'uploads';
//             const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
//             const contentType = file.mimetype || 'application/octet-stream';
//             s3ImageUrl = await uploadFileWithFolder(fileBuffer, filename, contentType, folder);
//         }

//         const privateGame = gameType === 'ONEONONE' ? true : isPrivate === 'true';
//         const parsedInviteUsers = typeof inviteUsers === 'string' ? JSON.parse(inviteUsers) : inviteUsers;

//         // 🎯 STEP 1: Build Set of unique invite IDs including creator
//         const allInviteUserIds = new Set(parsedInviteUsers);
//         allInviteUserIds.add(id); // Always add creator

//         // 🎯 STEP 2: Validate that all user IDs exist
//         const existingUsers = await prisma.user.findMany({
//             where: { id: { in: Array.from(allInviteUserIds) } },
//             select: { id: true },
//         });

//         const existingUserIds = new Set(existingUsers.map(user => user.id));
//         const invalidUserIds = Array.from(allInviteUserIds).filter(userId => !existingUserIds.has(userId));

//         if (invalidUserIds.length > 0) {
//             throw new ValidationError(`Invalid user IDs: ${invalidUserIds.join(', ')}`);
//         }

//         const inviteConnectData = Array.from(existingUserIds).map(userId => ({ id: userId }));

//         // 🎯 STEP 3: Create the game
//         const game = await prisma.game.create({
//             data: {
//                 createdById: id,
//                 gamePrice: Number(price),
//                 startDate: new Date(startDate),
//                 endDate: new Date(endDate),
//                 gameType,
//                 gameDescription: gamedescription,
//                 gameTitle,
//                 gameCode: otp,
//                 ...(s3ImageUrl && { image: s3ImageUrl }),
//                 isPrivate: privateGame,
//                 totalPlayers: { connect: [{ id }] },
//                 invitedFriends: { connect: inviteConnectData },
//                 ...(typeof isReminder !== 'undefined' && {
//                     isReminder: isReminder === 'true',
//                 }),
//             },
//             include: {
//                 totalPlayers: true,
//                 invitedFriends: true,
//             },
//         });

//         if (!game) {
//             throw new ValidationError("Game creation failed.");
//         }

//         // 🎯 STEP 4: Send invitations (notifications) to external users
//         const externalInviteUserIds = parsedInviteUsers.filter(userId => userId !== id && existingUserIds.has(userId));

//         if (externalInviteUserIds.length > 0) {
//             const notifications = externalInviteUserIds.map(userId => ({
//                 userId,
//                 notificationType: notificationConstants.INVITATION,
//                 gameId: game.id,
//                 title: "Game Invitation",
//                 description: `${userName} invited you to join the game "${gameTitle}"`,
//             }));

//             await prisma.notification.createMany({
//                 data: notifications,
//                 skipDuplicates: true,
//             });
//         }

//         const newCoinBalance = userCoins - game.gamePrice;

//         await prisma.coins.update({
//             where: {
//                 id: userCoinsRecord.id,
//             },
//             data: {
//                 coins: newCoinBalance
//             }
//         })

//         handlerOk(res, 201, game, "Game created successfully");
//     } catch (error) {
//         next(error);
//     }
// };


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


// const myGames = async (req, res, next) => {
//     try {
//         const { id } = req.user;
//         const { gameType } = req.query;
//         const now = new Date(); // UTC

//         console.log(now);


//         const baseCondition = {
//             OR: [
//                 { createdById: id },
//                 { invitedFriends: { some: { id: id } } }, // be explicit on the key
//             ],
//         };

//         // Keep Prisma filters simple & valid. We'll finish the nuanced logic in JS.
//         let where = { AND: [baseCondition] };

//         if (gameType === 'PRESENT') {
//             // Minimal prefilter: only games that have started (or start now)
//             where = { AND: [baseCondition, { startDate: { lte: now } }] };
//         } else if (gameType === 'PAST') {
//             // Minimal prefilter: games with any endDate set before now
//             // (Overnight edge cases are finalized in JS below)
//             where = { AND: [baseCondition, { endDate: { lt: now } }] };
//         } else if (gameType === 'FUTURE') {
//             where = { AND: [baseCondition, { startDate: { gt: now } }] };
//         }

//         const candidates = await prisma.game.findMany({
//             where,
//             include: { invitedFriends: true },
//             orderBy: { startDate: 'asc' },
//         });

//         // Normalize/classify in JS (handles "overnight" where end < start).
//         const games = candidates.filter(g => {
//             const start = new Date(g.startDate);
//             const endRaw = g.endDate ? new Date(g.endDate) : null;

//             // If end < start, treat as crossing midnight -> end = end + 1 day
//             const end = endRaw && endRaw < start
//                 ? new Date(endRaw.getTime() + 24 * 60 * 60 * 1000)
//                 : endRaw;

//             if (gameType === 'PRESENT') {
//                 // running now: start <= now <= end (or open-ended if end null)
//                 return start <= now && (end ? now <= end : true);
//             }
//             if (gameType === 'PAST') {
//                 // finished strictly before now (open-ended games can't be "past")
//                 return end ? end < now : false;
//             }
//             if (gameType === 'FUTURE') {
//                 return start > now;
//             }
//             return true; // if no gameType, return all candidates
//         });

//         if (games.length === 0) {
//             return handlerOk(res, 200, null, "no game found");
//         }
//         return handlerOk(res, 200, games, "games found successfully");


//     } catch (error) {
//         next(error);
//     }
// };


// const joinGame = async (req, res, next) => {
//     try {
//         const { id } = req.user;
//         const { gameId } = req.params;

//         const finduser = await prisma.user.findUnique({
//             where: {
//                 id: id
//             },
//             include: {
//                 Coins: true
//             }
//         });

//         const game = await prisma.game.findUnique({
//             where: {
//                 id: gameId,
//             },
//             include: {
//                 totalPlayers: true,
//             },
//         });

//         if (!game) {
//             throw new NotFoundError("game or game code not found");
//         }

//         const userCoinsRecord = finduser.Coins?.[0];
//         const userCoins = userCoinsRecord?.coins || 0;

//         if (game.gamePrice > userCoins) {
//             throw new ConflictError("You do not have enough coins to play this game.")
//         }

//         if (game.createdById === id) {
//             throw new ValidationError("you cannot join your own game");
//         }

//         const currentPlayers = Array.isArray(game.totalPlayers) ? game.totalPlayers : [];

//         if (game.gameType === "ONEONONE" && currentPlayers.length >= 2) {
//             throw new ValidationError("This one-on-one game is already full");
//         }


//         const alreadyJoined = currentPlayers.some(u => u.id === id);
//         if (alreadyJoined) {
//             throw new ValidationError("You have already joined this game");
//         }

//         // Double the game price if the number of players increases
//         const updatedGamePrice = game.gamePrice * (currentPlayers.length + 1);


//         const updatedGame = await prisma.game.update({
//             where: {
//                 id: gameId,
//             },
//             data: {
//                 totalPlayers: {
//                     connect: { id },
//                 },
//                 currentPrice: updatedGamePrice,
//                 invitedFriends: {
//                     connect: { id }
//                 }
//             },
//             include: {
//                 invitedFriends: true
//             },
//         })

//         const newCoinBalance = userCoins - game.gamePrice;

//         await prisma.coins.update({
//             where: {
//                 id: userCoinsRecord.id,
//             },
//             data: {
//                 coins: newCoinBalance
//             }
//         })

//         await prisma.notification.deleteMany({
//             where: {
//                 gameId: gameId
//             }
//         })



//         handlerOk(res, 200, updatedGame, "game joined successfully")



//     } catch (error) {
//         next(error)
//     }
// }

const myGames = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { gameType } = req.query;
    const now = new Date();

    // Base condition:
    // User is either the creator OR
    // user has an ACCEPTED status in the GamePlayerStatus table
    const baseCondition = {
      OR: [
        { createdById: id },
        {
          playerStatuses: {
            some: {
              userId: id,
              status: 'ACCEPTED',
            },
          },
        },
      ],
    };

    // Prisma filters by gameType + base condition
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
        playerStatuses: true, // include to check statuses if needed
      },
      orderBy: { startDate: 'asc' },
    });

    // Post-filter logic (handle overnight cross-midnight, etc)
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
        playerStatuses: true,
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
    const existingStatus = game.playerStatuses.find(ps => ps.userId === id);

    if (existingStatus && existingStatus.status === 'ACCEPTED') {
      throw new ValidationError("You have already joined this game");
    }

    // Check ONEONONE max players = 2 and accepted players count
    const acceptedPlayers = game.playerStatuses.filter(ps => ps.status === 'ACCEPTED');
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


module.exports = {
    createGame,
    showGames,
    joinGame,
    userSearch,
    showCoins,
    coinPurchase,
    saveUserStep,
    myGames
}