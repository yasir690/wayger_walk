-- AlterTable
ALTER TABLE `game` ADD COLUMN `winnerId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_winnerId_fkey` FOREIGN KEY (`winnerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
