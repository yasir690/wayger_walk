/*
  Warnings:

  - Added the required column `Images` to the `FeedBack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `feedback` ADD COLUMN `Images` JSON NOT NULL;
