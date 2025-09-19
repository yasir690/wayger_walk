const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const dbConnect = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    process.exit(1); // Exit app if DB connection fails

  }
}

module.exports = dbConnect;