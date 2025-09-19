const prisma = require("../config/prismaConfig");
const { hashPassword } = require("../utils/passwordHashed");
const { userConstants } = require("../constants/constants");

const adminSeed = async () => {
  try {
    const email = "admin@example.com";
    const password = "admin123";

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log("✅ Admin already exists. Skipping seeding.");
      return;
    }

    const hashedPassword = await hashPassword(password);

    await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        userType: userConstants.ADMIN,
      },
    });

    console.log("✅ Admin seeded successfully.");
  } catch (error) {
    console.log(error);

  }


}

module.exports = adminSeed