-- CreateTable
CREATE TABLE `AdminWallet` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `balance` DOUBLE NOT NULL DEFAULT 0.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminWallet_adminId_key`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminWalletTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdminWallet` ADD CONSTRAINT `AdminWallet_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminWalletTransaction` ADD CONSTRAINT `AdminWalletTransaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `AdminWallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
