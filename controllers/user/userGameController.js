const prisma = require("../../config/prismaConfig");
const { ValidationError, NotFoundError, BadRequestError } = require("../../resHandler/CustomError");
const { handlerOk } = require("../../resHandler/responseHandler");
const { generateOtp } = require("../../utils/generateOtp");
const { v4: uuidv4 } = require('uuid');
const path = require("path");
const uploadFileWithFolder = require("../../utils/s3Upload");

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
        
           return handlerOk(res,200,null,"users not found")
        }

      return  handlerOk(res, 200, users, "users found successfully")

    } catch (error) {
        next(error)
    }
}


const createGame = async (req, res, next) => {
    try {
        const { id,userName } = req.user;
        const { price, startDate, endDate,
            gameType, gamedescription, gameTitle, gameDuration, totalSteps, isReminder,isPrivate,inviteUsers = '[]'  } = req.body;
        const file = req.file;

        console.log(req.body);


        const otp = generateOtp();



        const fileBuffer = file.buffer;
        const folder = 'uploads';
        const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        const contentType = file.mimetype || 'application/octet-stream';

        const s3ImageUrl = await uploadFileWithFolder(fileBuffer, filename, contentType, folder);

        const privateGame = gameType === 'ONEONONE' ? true : isPrivate === 'true';

const parsedInviteUsers = typeof inviteUsers === 'string' ? JSON.parse(inviteUsers) : inviteUsers;

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
                gameDuration,
                totalSteps: Number(totalSteps),
                image: s3ImageUrl,
                isPrivate: gameType === 'ONEONONE' ? true : isPrivate === 'true',
                totalPlayers: {
                    connect: [{ id }],
                },
                invitedFriends:{
                connect:parsedInviteUsers.map(userid=>({id:userid}))
                },
                ...(typeof isReminder !== 'undefined' && {
                    isReminder: isReminder === 'true',
                }),
            },
            include: {
                totalPlayers: true,
                invitedFriends:true 
            },
        });

        if (!game) {
            throw new ValidationError("game not create");
        }


         if (privateGame && parsedInviteUsers.length > 0) {
            const notifications = parsedInviteUsers.map(userId => ({
                userId: userId,
                title: "Game Invitation",
                description: `${userName} invited you to join the game ${gameTitle}`,
            }));

            await prisma.notification.createMany({
                data: notifications,
                skipDuplicates: true,
            });
        }

        handlerOk(res, 201, game, "game created successfully")

    } catch (error) {
        next(error)
    }
}

const showGames = async (req, res, next) => {
    try {

        const games = await prisma.game.findMany({
            include: {
                totalPlayers: true,
                invitedFriends:true
            }
        });

        if (games.length === 0) {
            // throw new NotFoundError("no game found");

                       return handlerOk(res,200,null,"no game found")


        }

       return handlerOk(res, 200, games, "games found successfully");

    } catch (error) {
        next(error)
    }
}

const myGames=async (req,res,next) => {
   try {
        const {id}=req.user;  
        const games = await prisma.game.findMany({

             where:{
                invitedFriends:{
some: {
        id: id, // id from req.user
      },                }
             },
            include: {
                // totalPlayers: true,
                invitedFriends:true
            }
        });

        if (games.length === 0) {
            // throw new NotFoundError("no game found");

                       return handlerOk(res,200,null,"no game found")


        }

       return handlerOk(res, 200, games, "games found successfully");

    } catch (error) {
        next(error)
    }
}

const joinGame = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { gameId } = req.params;
        const { gameCode,userIds = []  } = req.body;

        const game = await prisma.game.findUnique({
            where: {
                id: gameId,
                gameCode: gameCode
            },
            include: {
                totalPlayers: true,
            },
        });

        if (!game) {
            throw new NotFoundError("game or game code not found");
        }

        if (game.createdById === id) {
            throw new ValidationError("you cannot join your own game");
        }

        const currentPlayers = Array.isArray(game.totalPlayers) ? game.totalPlayers : [];

        if (game.gameType === "ONEONONE" && currentPlayers.length >= 2) {
            throw new ValidationError("This one-on-one game is already full");
        }

        if (currentPlayers.includes(id)) {
            throw new ValidationError("You have already joined this game");
        }

          // Restrict private TOURNAMENT access using userIds
          
        if (game.gameType === "TOURNAMENT" && game.isPrivate) {
            if (!Array.isArray(userIds) || !userIds.includes(id)) {
                throw new ValidationError("You are not allowed to join this private tournament");
            }
        }



        const updatedGame = await prisma.game.update({
            where: {
                id: gameId,
            },
            data: {
                totalPlayers: {
                    connect: { id },
                },
            },
            include: {
                totalPlayers: true,
            },
        })



        handlerOk(res, 200, updatedGame, "game joined successfully")



    } catch (error) {
        next(error)
    }
}

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

const saveUserStep=async (req,res,next) => {
    try {
        const {step,distance,sources,date}=req.body;
        const {id}=req.user;

        const savestep=await prisma.userStep.create({
            data:{
                steps:step,
                distance:distance,
                sources:sources,
                date:date,
                userId:id
            },
        
        });

        if(!savestep){
            throw new ValidationError("step not save")
        }

        handlerOk(res,200,savestep,"step save successfully");
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