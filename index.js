const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
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


require("dotenv").config();



app.use(cors({ origin: '*' }));
app.use(morgan('dev'));

app.use('/public', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(API_PRIFEX, rootRouter);

// Global error handling
app.use(globalErrorMiddleware);

app.get("/", (req, res) => {
  res.send("server is running....!!!!");
});

dbConnect();

adminSeed();

coinSeed();

adminWalletSeed();


// Run every 1 minutes


// cron.schedule('*/1 * * * *', async () => {
//   try {
//     console.log('⏰ Running game check job...');

//     const now = new Date();
//     now.setSeconds(0, 0); // Normalize to the nearest minute
//     console.log('📅 Current UTC time:', now.toISOString());

//     const endedGames = await prisma.game.findMany({
//       where: {
//         endDate: { lte: now },
//         isEnded: false,
//       },
//       include: {
//         totalPlayers: true,
//         invitedFriends: true
//       },
//     });

//     if (endedGames.length === 0) {
//       console.log('✅ No ended games to process.');
//       return;
//     }

//     console.log(`🔍 Found ${endedGames.length} ended game(s).`);

//     for (const game of endedGames) {
//       const { id: gameId, gameTitle, invitedFriends, currentPrice } = game;

//       // Ensure invitedFriends is not empty
//       const playerIds = invitedFriends?.map(player => player.id) || [];
//       if (playerIds.length === 0) {
//         console.log(`⚠️ No players found for game "${gameTitle}"`);
//         continue;
//       }

//       // Get total steps per user (no date filter)
//       const stepTotals = await prisma.userStep.groupBy({
//         by: ['userId'],
//         where: {
//           userId: { in: playerIds },
//         },
//         _sum: {
//           steps: true,
//         },
//       });

//       if (stepTotals.length === 0) {
//         console.log(`⚠️ No step data found for game "${gameTitle}"`);
//         continue;
//       }

//       console.log(`📊 Step Totals for game "${gameTitle}":`);
//       stepTotals.forEach(entry => {
//         console.log(`- ${entry.userId}: ${entry._sum.steps ?? 0} steps`);
//       });

//       // Find the user with the most steps
//       let winner = stepTotals[0];
//       for (const curr of stepTotals) {
//         if ((curr._sum.steps ?? 0) > (winner._sum.steps ?? 0)) {
//           winner = curr;
//         }
//       }

//       const winnerUser = await prisma.user.findUnique({
//         where: { id: winner.userId },
//       });

//       if (!winnerUser) {
//         console.warn(`❌ Winner not found: ${winner.userId}`);
//         continue;
//       }

//       const stepCount = winner._sum.steps ?? 0;
//       const deductionAmount = currentPrice * 0.1; // 10% deduction
//       const winnerAmount = currentPrice - deductionAmount; // Remaining amount for the winner
//       console.log(currentPrice, 'current price');
//       console.log(deductionAmount, 'deduct amount');
//       console.log(winnerAmount, 'winner amount');

//       // Send notification to winner
//       await prisma.notification.create({
//         data: {
//           userId: winnerUser.id,
//           notificationType: notificationConstants.WINNING,
//           gameId: gameId,
//           title: `🎉 ${winnerUser.userName} won the game!`,
//           description: `You won ${gameTitle} with ${stepCount} steps! and your winning amount is ${winnerAmount}`,
//         },
//       });

//       // Mark game as ended and record winner
//       await prisma.game.update({
//         where: { id: gameId },
//         data: {
//           isEnded: true,
//           winnerId: winnerUser.id,
//           gameStatus: gameStatusConstants.PASTGAME
//         },
//       });

//       // Using a transaction to ensure atomicity of both wallet updates
//       await prisma.$transaction(async (tx) => {
//         // Ensure winner's wallet exists, create it with balance 0 if it doesn't exist
//         const winnerWallet = await tx.wallet.upsert({
//           where: { userId: winnerUser.id },
//           create: {
//             userId: winnerUser.id,
//             balance: 0, // Initial balance if wallet is created
//           },
//           update: {
//             balance: {
//               increment: winnerAmount, // Add remaining 90% to winner's wallet
//             }
//           }
//         });

//         // ✅ Ensure winner has a Coins record and add winning coins
//         const winnerCoins = await tx.coins.upsert({
//           where: { userId: winnerUser.id },
//           create: {
//             userId: winnerUser.id,
//             coins: winnerAmount,   // start with winning coins
//           },
//           update: {
//             coins: {
//               increment: winnerAmount,  // add coins equal to winning amount
//             }
//           }
//         });

//         console.log("Winner Wallet:", winnerWallet.balance);
//         console.log("Winner Coins:", winnerCoins.coins);

//         // Check the balance after adding winner amount
//         const updatedWinnerWallet = await tx.wallet.findUnique({
//           where: { userId: winnerUser.id },
//         });
//         console.log('Winner Wallet Balance After Winner Amount Added:', updatedWinnerWallet.balance);

//         // Find or create admin wallet
//         const findAdmin = await tx.admin.findFirst({
//           where: {
//             email: "admin@example.com" // Consider switching to adminId
//           }
//         });

//         if (!findAdmin) {
//           throw new NotFoundError("Admin not found");
//         }

//         const adminWallet = await tx.adminWallet.upsert({
//           where: { adminId: findAdmin.id },
//           create: {
//             adminId: findAdmin.id,
//             balance: deductionAmount, // Admin starts with this commission amount
//           },
//           update: {
//             balance: {
//               increment: deductionAmount // Add commission to admin's wallet
//             }
//           }
//         });

//         // Record admin wallet transaction
//         await tx.adminWalletTransaction.create({
//           data: {
//             walletId: adminWallet.id,
//             amount: deductionAmount,
//             gameId: gameId,
//             description: `Admin's share of game "${gameTitle}" earnings`
//           }
//         });
//       });

//       console.log(`🏆 Game "${gameTitle}" ended. Winner: ${winnerUser.userName} with ${stepCount} steps.`);
//     }
//   } catch (error) {
//     console.error('❌ Error in game check job:', error);
//   }
// });

// Every minute
// cron.schedule('*/1 * * * *', async () => {
//   try {
//     console.log('⏰ Running game check job...');

//     const now = new Date();
//     now.setSeconds(0, 0); // normalize to nearest minute (UTC)
//     console.log('📅 Current UTC time:', now.toISOString());

//     // 1) Pick games that have ended and not processed yet
//     const endedGames = await prisma.game.findMany({
//       where: { endDate: { lte: now }, isEnded: false },
//       include: {
//         invitedFriends: { select: { id: true, userName: true } },
//       },
//     });

//     if (!endedGames.length) {
//       console.log('✅ No ended games to process.');
//       return;
//     }

//     console.log(`🔍 Found ${endedGames.length} ended game(s).`);

//     for (const game of endedGames) {
//       const { id: gameId, gameTitle, invitedFriends } = game;

//       // Participants = invited friends
//       const playerIds = invitedFriends?.map(p => p.id) ?? [];
//       if (!playerIds.length) {
//         console.log(`⚠️ No participants for "${gameTitle}" (${gameId})`);
//         continue;
//       }

//       // 2) Compute winner by summing steps **within game window (UTC)**
//       const start = new Date(game.startDate); // exact instant
//       const end = new Date(game.endDate);   // exact instant (inclusive)
//       // If you want to include the entire end *calendar* day in UTC:
//       // const endExclusive = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1, 0, 0, 0, 0));

//       const totals = await prisma.userStep.groupBy({
//         by: ['userId'],
//         where: {
//           userId: { in: playerIds },
//           date: { gte: start, lte: end }, // use { gte: start, lt: endExclusive } if whole end-day is desired
//         },
//         _sum: { steps: true },
//       });

//       if (!totals.length) {
//         console.log(`⚠️ No step data found for game "${gameTitle}" (${gameId})`);
//         // still mark as ended with no winner, or skip — pick your rule
//         await prisma.game.update({
//           where: { id: gameId },
//           data: { isEnded: true, gameStatus: gameStatusConstants.PASTGAME, winnerId: null },
//         });
//         continue;
//       }

//       // Pick max steps (basic tiebreaker keeps the earliest with max)
//       let winnerAgg = totals[0];
//       for (const t of totals) {
//         if ((t._sum.steps ?? 0) > (winnerAgg._sum.steps ?? 0)) winnerAgg = t;
//       }

//       const winnerUser = await prisma.user.findUnique({ where: { id: winnerAgg.userId } });
//       if (!winnerUser) {
//         console.warn(`❌ Winner not found userId=${winnerAgg.userId} for game ${gameId}`);
//         continue;
//       }

//       const stepCount = winnerAgg._sum.steps ?? 0;

//       // Pick payout base — prefer currentPrice if set, else gamePrice
//       const basePrice = (typeof game.currentPrice === 'number' && !Number.isNaN(game.currentPrice))
//         ? game.currentPrice
//         : game.gamePrice;

//       const deductionAmount = +(basePrice * 0.10).toFixed(2); // 10% to admin
//       const winnerAmount = +(basePrice - deductionAmount).toFixed(2); // 90% to winner

//       // Coins are Int in schema → pick a policy (here: 1 coin per currency unit, floor)
//       const coinsToAdd = Math.floor(winnerAmount);

//       console.log(`🎯 Winner ${winnerUser.userName} (${winnerUser.id}) — steps=${stepCount} | base=${basePrice} | admin=${deductionAmount} | winner=${winnerAmount} | coins=${coinsToAdd}`);

//       // 3) One atomic transaction for: idempotency check, set winner, wallets/coins, admin tx, notification
//       await prisma.$transaction(async (tx) => {
//         // Idempotency: if an AdminWalletTransaction already exists for this game, skip (prevents double-run)
//         const existingAdminTx = await tx.adminWalletTransaction.findFirst({ where: { gameId: gameId } });
//         if (existingAdminTx) {
//           console.log(`⛑️ Game ${gameId} already processed (admin tx exists). Skipping.`);
//           return;
//         }

//         // Set winner + mark ended
//         await tx.game.update({
//           where: { id: gameId },
//           data: {
//             isEnded: true,
//             winnerId: winnerUser.id,
//             gameStatus: gameStatusConstants.PASTGAME
//           },
//         });

//         // Ensure winner has wallet and add winnerAmount
//         await tx.wallet.upsert({
//           where: { userId: winnerUser.id },
//           create: { userId: winnerUser.id, balance: winnerAmount },
//           update: { balance: { increment: winnerAmount } }
//         });

//         // Ensure winner has Coins and add integer coins
//         await tx.coins.upsert({
//           where: { userId: winnerUser.id },
//           create: { userId: winnerUser.id, coins: coinsToAdd },
//           update: { coins: { increment: coinsToAdd } }
//         });

//         // Admin wallet: find admin and upsert wallet balance
//         const admin = await tx.admin.findFirst({ where: { email: "admin@example.com" } });
//         if (!admin) throw new NotFoundError("Admin not found");

//         const adminWallet = await tx.adminWallet.upsert({
//           where: { adminId: admin.id },
//           create: { adminId: admin.id, balance: deductionAmount },
//           update: { balance: { increment: deductionAmount } }
//         });

//         // Record admin wallet transaction (ids: unique per game if you add @unique on gameId)
//         await tx.adminWalletTransaction.create({
//           data: {
//             walletId: adminWallet.id,
//             amount: deductionAmount,
//             gameId: gameId,
//             description: `Admin's share of game "${gameTitle}" earnings`,
//           }
//         });

//         // Notify winner
//         await tx.notification.create({
//           data: {
//             userId: winnerUser.id,
//             notificationType: notificationConstants.WINNING,
//             gameId: gameId,
//             title: `🎉 ${winnerUser.userName} won the game!`,
//             description: `You won ${gameTitle} with ${stepCount} steps! Your winning amount is ${winnerAmount}.`,
//           },
//         });
//       });

//       console.log(`🏆 Game "${gameTitle}" (${gameId}) processed. Winner: ${winnerUser.userName} (${stepCount} steps).`);
//     }
//   } catch (error) {
//     console.error('❌ Error in game check job:', error);
//   }
// });


// Runs every minute
cron.schedule('*/1 * * * *', async () => {
  try {
    console.log('⏰ Running game check job...');

    const now = new Date();
    now.setSeconds(0, 0); // normalize to the nearest minute
    console.log('📅 Current UTC time:', now.toISOString());

    // 1) Find games that reached their end and not processed yet
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
        // You may still want to mark it ended without a winner:
        await prisma.game.update({
          where: { id: gameId },
          data: { isEnded: true, gameStatus: gameStatusConstants.PASTGAME, winnerId: null },
        });
        continue;
      }

      // 2) Sum steps within the game window (UTC), using end-exclusive
      const start = new Date(game.startDate);
      const end = new Date(game.endDate);
      const endExclusive = new Date(end.getTime()); // exclusive bound

      const totals = await prisma.userStep.groupBy({
        by: ['userId'],
        where: {
          userId: { in: playerIds },
          date: { gte: start, lt: endExclusive },
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

      // 3) Pick winner (highest steps; earliest wins in a tie)
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

      // 4) Payout split
      const basePrice = (typeof game.currentPrice === 'number' && !Number.isNaN(game.currentPrice))
        ? game.currentPrice
        : game.gamePrice;

      const deductionAmount = +(basePrice * 0.10).toFixed(2); // admin 10%
      const winnerAmount = +(basePrice - deductionAmount).toFixed(2); // winner 90%

      // Coins are Int in schema
      const coinsToAdd = Math.floor(winnerAmount);

      console.log(`🎯 Winner ${winnerUser.userName} (${winnerUser.id}) — steps=${stepCount} | base=${basePrice} | admin=${deductionAmount} | winner=${winnerAmount} | coins=${coinsToAdd}`);

      // 5) Single atomic transaction (idempotent via AdminWalletTransaction check)
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

        // Winner coins (Int)
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

        await tx.adminWalletTransaction.create({
          data: {
            walletId: adminWallet.id,
            amount: deductionAmount,
            gameId,
            description: `Admin's share of game "${gameTitle}" earnings`,
          },
        });

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
