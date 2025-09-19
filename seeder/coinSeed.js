const prisma = require("../config/prismaConfig");

const coinSeed = async () => {
  try {
    const coins = [
      {
        coins: "1",
        price: "1$",
        discount: "10%"
      },
      {
        coins: "2",
        price: "2$",
        discount: "10%"
      },
      {
        coins: "3",
        price: "3$",
        discount: "10%"
      },
      {
        coins: "4",
        price: "4$",
        discount: "10%"
      },
      {
        coins: "5",
        price: "5$",
        discount: "10%"
      },
      {
        coins: "6",
        price: "6$",
        discount: "10%"
      }
    ];

    const email = "admin@example.com";


    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!existingAdmin) {
      console.log("❌ Admin not found.");
      return;
    }


    for (const coin of coins) {

      const existingCoins = await prisma.coinPlan.findFirst({
        where: {
          coins: coin.coins,
          price: coin.price,
          discount: coin.discount,
          finalPrice: "0",  // Storing the calculated final price
          adminId: existingAdmin.id,
        },
      });

      if (!existingCoins) {

        await prisma.coinPlan.create({
          data: {
            coins: coin.coins,
            price: coin.price,
            discount: coin.discount,
            finalPrice: "0",  // Storing the calculated final price
            adminId: existingAdmin.id,
          }
        });

      }
    }


    console.log("✅ Coins seeded successfully.");

  } catch (error) {
    console.log(error);
  }
}

module.exports = coinSeed;