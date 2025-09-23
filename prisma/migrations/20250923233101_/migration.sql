/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `UserStep` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `UserStep_userId_date_key` ON `UserStep`(`userId`, `date`);
