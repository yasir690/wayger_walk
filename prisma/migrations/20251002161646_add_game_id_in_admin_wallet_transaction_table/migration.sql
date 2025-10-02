-- AlterTable
ALTER TABLE `AdminWalletTransaction` ADD COLUMN `gameId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `AdminWalletTransaction` ADD CONSTRAINT `AdminWalletTransaction_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
