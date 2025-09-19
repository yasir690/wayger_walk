-- CreateTable
CREATE TABLE `Game` (
    `id` VARCHAR(191) NOT NULL,
    `gameType` ENUM('TOURNAMENT', 'ONEONONE') NULL,
    `gamePrice` DOUBLE NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `gameTitle` VARCHAR(191) NOT NULL,
    `gameCode` VARCHAR(191) NOT NULL,
    `gameDescription` VARCHAR(191) NOT NULL,
    `gameDuration` VARCHAR(191) NOT NULL,
    `totalPlayers` INTEGER NOT NULL,
    `totalSteps` INTEGER NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
