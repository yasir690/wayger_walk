-- CreateTable
CREATE TABLE `CoinPlan` (
    `id` VARCHAR(191) NOT NULL,
    `coins` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `discount` DOUBLE NULL,
    `finalPrice` DOUBLE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoinPurchase` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `amountPaid` DOUBLE NOT NULL,
    `coinsAdded` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CoinPurchase` ADD CONSTRAINT `CoinPurchase_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoinPurchase` ADD CONSTRAINT `CoinPurchase_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `CoinPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
