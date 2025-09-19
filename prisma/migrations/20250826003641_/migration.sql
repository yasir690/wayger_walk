/*
  Warnings:

  - You are about to drop the column `FeedBack` on the `feedback` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `feedback` DROP COLUMN `FeedBack`,
    ADD COLUMN `message` VARCHAR(191) NULL,
    ADD COLUMN `subject` VARCHAR(191) NULL;
