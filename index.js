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


// Run every 1 minutes

cron.schedule('*/1 * * * *', async () => {
  try {
    console.log('⏰ Running game check job...');

    const now = new Date();
    now.setSeconds(0, 0); // Normalize to nearest minute
    console.log('📅 Current UTC time:', now.toISOString());

    const endedGames = await prisma.game.findMany({
      where: {
        endDate: { lte: now },
        isEnded: false,
      },
      include: {
        totalPlayers: true,
        invitedFriends: true
      },
    });

    if (endedGames.length === 0) {
      console.log('✅ No ended games to process.');
      return;
    }

    console.log(`🔍 Found ${endedGames.length} ended game(s).`);

    for (const game of endedGames) {
      const { id: gameId, gameTitle, totalPlayers, invitedFriends } = game;
      const playerIds = invitedFriends.map(player => player.id);

      if (playerIds.length === 0) {
        console.log(`⚠️ No players found for game "${gameTitle}"`);
        continue;
      }

      // Get total steps per user (no date filter)
      const stepTotals = await prisma.userStep.groupBy({
        by: ['userId'],
        where: {
          userId: { in: playerIds },
        },
        _sum: {
          steps: true,
        },
      });

      if (stepTotals.length === 0) {
        console.log(`⚠️ No step data found for game "${gameTitle}"`);
        continue;
      }

      console.log(`📊 Step Totals for game "${gameTitle}":`);
      stepTotals.forEach(entry => {
        console.log(`- ${entry.userId}: ${entry._sum.steps ?? 0} steps`);
      });

      // Find the user with the most steps
      let winner = stepTotals[0];
      for (const curr of stepTotals) {
        if ((curr._sum.steps ?? 0) > (winner._sum.steps ?? 0)) {
          winner = curr;
        }
      }

      const winnerUser = await prisma.user.findUnique({
        where: { id: winner.userId },
      });

      if (!winnerUser) {
        console.warn(`❌ Winner not found: ${winner.userId}`);
        continue;
      }

      const stepCount = winner._sum.steps ?? 0;

      // Send notification to winner
      await prisma.notification.create({
        data: {
          userId: winnerUser.id,
          notificationType: notificationConstants.WINNING,
          title: `🎉 ${winnerUser.userName} won the game!`,
          description: `You won "${gameTitle}" with ${stepCount} steps!`,
        },
      });

      // Mark game as ended and record winner
      await prisma.game.update({
        where: { id: gameId },
        data: {
          isEnded: true,
          winnerId: winnerUser.id,
          gameStatus: gameStatusConstants.PASTGAME
        },
      });


      console.log(`🏆 Game "${gameTitle}" ended. Winner: ${winnerUser.userName} with ${stepCount} steps.`);
    }
  } catch (error) {
    console.error('❌ Error in game check job:', error);
  }
});




app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
