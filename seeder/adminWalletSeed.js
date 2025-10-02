const prisma = require("../config/prismaConfig");


const adminWalletSeed = async () => {
  try {
    const email = "admin@example.com";

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!existingAdmin) {
      console.log("✅ Admin not exists");
    }


    const findadminwallet = await prisma.adminWallet.findFirst({
      where: {
        adminId: existingAdmin.id
      }
    });


    if (findadminwallet) {
      console.log("✅ Admin wallet already exists. Skipping seeding.");
      return ''
    }

    await prisma.adminWallet.create({
      data: {
        adminId: existingAdmin.id,
        balance: 0.0
      },
    });

    console.log("✅ Admin seeded successfully.");
  } catch (error) {
    console.log(error);

  }


}

module.exports = adminWalletSeed