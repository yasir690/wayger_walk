/*
  Warnings:

  - You are about to alter the column `amountPaid` on the `CoinPurchase` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `CoinPurchase` MODIFY `amountPaid` VARCHAR(191) NOT NULL;
