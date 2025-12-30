const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
// require('dotenv').config({ path: __dirname + '/.env' });
const app = express();
const port = process.env.PORT || 4000;
const API_PRIFEX = '/api/v1';  // Prefix for all routes
const rootRouter = require("./routes/index");
const globalErrorMiddleware = require("./middleware/globalMiddleware");
const dbConnect = require('./db/connectivity');
const adminSeed = require('./seeder/adminSeed');
const coinSeed = require('./seeder/coinSeed');
const prisma = require("./config/prismaConfig");
const cron = require('node-cron');

const morgan = require('morgan');
const { gameStatusConstants, notificationConstants } = require('./constants/constants');
const { NotFoundError } = require('./resHandler/CustomError');
const adminWalletSeed = require('./seeder/adminWalletSeed');
const dayRangeUTC = require('./utils/dayrangeutc');


// require("dotenv").config();



app.use(cors({ origin: '*' }));
app.use(morgan('dev'));

app.use('/public', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(API_PRIFEX, rootRouter);

// Global error handling
app.use(globalErrorMiddleware);

app.get("/", (req, res) => {
  res.send("server is running....!!!");
});

dbConnect();

adminSeed();

coinSeed();

adminWalletSeed();


// Run every 1 minutes

cron.schedule('*/1 * * * *', async () => {
  try {
    console.log('⏰ Running game check job...');

    const now = new Date();
    now.setSeconds(0, 0);
    console.log('📅 Current UTC time:', now.toISOString());

    // 1) All games that have ended but not yet processed
    const endedGames = await prisma.game.findMany({
      where: { endDate: { lte: now }, isEnded: false },
      include: {
        invitedFriends: { select: { id: true, userName: true } },
      },
    });

    if (!endedGames.length) {
      console.log('✅ No ended games to process.');
      return;
    }

    console.log(`🔍 Found ${endedGames.length} ended game(s).`);

    for (const game of endedGames) {
      const { id: gameId, gameTitle, invitedFriends } = game;

      const playerIds = invitedFriends?.map(p => p.id) ?? [];
      if (!playerIds.length) {
        console.log(`⚠️ No participants for "${gameTitle}" (${gameId})`);
        await prisma.game.update({
          where: { id: gameId },
          data: { isEnded: true, gameStatus: gameStatusConstants.PASTGAME, winnerId: null },
        });
        continue;
      }

      // 2) Sum steps within the game period at *day* granularity (UTC)
     const { startDayUTC, endDayInclusiveUTC } = dayRangeUTC(game.startDate, game.endDate);

const totals = await prisma.userStep.groupBy({
  by: ['userId'],
  where: {
    userId: { in: playerIds },
    date: {
      gte: startDayUTC,
      lte: endDayInclusiveUTC,
    },
  },
  _sum: { steps: true },
});

      if (!totals.length) {
        console.log(`⚠️ No step data for "${gameTitle}" (${gameId}) in its window.`);
        await prisma.game.update({
          where: { id: gameId },
          data: { isEnded: true, gameStatus: gameStatusConstants.PASTGAME, winnerId: null },
        });
        continue;
      }

      // 3) Pick winner (highest steps; earliest wins on tie)
      let winnerAgg = totals[0];
      for (const t of totals) {
        if ((t._sum.steps ?? 0) > (winnerAgg._sum.steps ?? 0)) winnerAgg = t;
      }

      const winnerUser = await prisma.user.findUnique({ where: { id: winnerAgg.userId } });
      if (!winnerUser) {
        console.warn(`❌ Winner not found userId=${winnerAgg.userId} for game ${gameId}`);
        continue;
      }

      const stepCount = winnerAgg._sum.steps ?? 0;

      // 4) Payout split (prefer currentPrice if set)
      const basePrice =
        (typeof game.currentPrice === 'number' && !Number.isNaN(game.currentPrice))
          ? game.currentPrice
          : game.gamePrice;

      const deductionAmount = +(basePrice * 0.10).toFixed(2); // 10%
      const winnerAmount = +(basePrice - deductionAmount).toFixed(2); // 90%
      const coinsToAdd = Math.floor(winnerAmount); // Coins are Int

      console.log(`🎯 Winner ${winnerUser.userName} (${winnerUser.id}) — steps=${stepCount} | base=${basePrice} | admin=${deductionAmount} | winner=${winnerAmount} | coins=${coinsToAdd}`);

      // 5) Atomic payout w/ idempotency
      await prisma.$transaction(async (tx) => {
        const existingAdminTx = await tx.adminWalletTransaction.findFirst({ where: { gameId } });
        if (existingAdminTx) {
          console.log(`⛑️ Game ${gameId} already processed. Skipping.`);
          return;
        }

        // Mark ended + set winner
        await tx.game.update({
          where: { id: gameId },
          data: { isEnded: true, winnerId: winnerUser.id, gameStatus: gameStatusConstants.PASTGAME },
        });

        // Winner wallet
        await tx.wallet.upsert({
          where: { userId: winnerUser.id },
          create: { userId: winnerUser.id, balance: winnerAmount },
          update: { balance: { increment: winnerAmount } },
        });

        // Winner coins
        await tx.coins.upsert({
          where: { userId: winnerUser.id },
          create: { userId: winnerUser.id, coins: coinsToAdd },
          update: { coins: { increment: coinsToAdd } },
        });

        // Admin wallet + transaction
        const admin = await tx.admin.findFirst({ where: { email: "admin@example.com" } });
        if (!admin) throw new NotFoundError("Admin not found");

        const adminWallet = await tx.adminWallet.upsert({
          where: { adminId: admin.id },
          create: { adminId: admin.id, balance: deductionAmount },
          update: { balance: { increment: deductionAmount } },
        });

        // await tx.adminWalletTransaction.create({
        //   data: {
        //     walletId: adminWallet.id,
        //     amount: deductionAmount,
        //     gameId,
        //     description: `Admin's share of game "${gameTitle}" earnings`,
        //   },
        // });

        // Notify winner
        await tx.notification.create({
          data: {
            userId: winnerUser.id,
            notificationType: notificationConstants.WINNING,
            gameId,
            title: `🎉 ${winnerUser.userName} won the game!`,
            description: `You won ${gameTitle} with ${stepCount} steps! Your winning amount is ${winnerAmount}.`,
          },
        });
      });

      console.log(`🏆 Game "${gameTitle}" (${gameId}) processed. Winner: ${winnerUser.userName} (${stepCount} steps).`);
    }
  } catch (error) {
    console.error('❌ Error in game check job:', error);
  }
});






app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
