/*
  Warnings:

  - Made the column `notificationType` on table `notification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `notification` MODIFY `notificationType` ENUM('WINNING', 'INVITATION') NOT NULL;
