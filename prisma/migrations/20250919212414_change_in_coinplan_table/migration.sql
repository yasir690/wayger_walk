/*
  Warnings:

  - You are about to alter the column `price` on the `CoinPlan` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.
  - You are about to alter the column `discount` on the `CoinPlan` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.
  - You are about to alter the column `finalPrice` on the `CoinPlan` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.
  - Added the required column `adminId` to the `CoinPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CoinPlan` ADD COLUMN `adminId` VARCHAR(191) NOT NULL,
    MODIFY `price` VARCHAR(191) NOT NULL,
    MODIFY `discount` VARCHAR(191) NULL,
    MODIFY `finalPrice` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `CoinPlan` ADD CONSTRAINT `CoinPlan_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
