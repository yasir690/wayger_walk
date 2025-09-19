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
            throw new NotFoundError("users not found")
        }

        handlerOk(res, 200, users, "users found successfully")

    } catch (error) {
        next(error)
    }
}


const createGame = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { price, startDate, endDate,
            gameType, gamedescription, gameTitle, gameDuration, totalSteps, isReminder } = req.body;
        const file = req.file;

        console.log(req.body);


        const otp = generateOtp();



        const fileBuffer = file.buffer;
        const folder = 'uploads';
        const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        const contentType = file.mimetype || 'application/octet-stream';

        const s3ImageUrl = await uploadFileWithFolder(fileBuffer, filename, contentType, folder);

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
                totalPlayers: {
                    connect: [{ id }], // ✅ connect creator as first participant
                },
                ...(typeof isReminder !== 'undefined' && {
                    isReminder: isReminder === 'true',
                }),
            },
            include: {
                totalPlayers: true, // optional: to return full player details
            },
        });

        if (!game) {
            throw new ValidationError("game not create");
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
            }
        });

        if (games.length === 0) {
            throw new NotFoundError("no game found");
        }

        handlerOk(res, 200, games, "games found successfully");

    } catch (error) {
        next(error)
    }
}

const joinGame = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { gameId } = req.params;
        const { gameCode } = req.body;

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

        // Initialize array if null
        const currentPlayers = Array.isArray(game.totalPlayers) ? game.totalPlayers : [];

        // Restrict based on gameType
        if (game.gameType === "ONEONONE" && currentPlayers.length >= 2) {
            throw new ValidationError("This one-on-one game is already full");
        }

        // Prevent duplicate join
        if (currentPlayers.includes(id)) {
            throw new ValidationError("You have already joined this game");
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


module.exports = {
    createGame,
    showGames,
    joinGame,
    userSearch,
    showCoins,
    coinPurchase
}