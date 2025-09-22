/*
  Warnings:

  - You are about to drop the column `gameDuration` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `totalSteps` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Game` DROP COLUMN `gameDuration`,
    DROP COLUMN `totalSteps`;
