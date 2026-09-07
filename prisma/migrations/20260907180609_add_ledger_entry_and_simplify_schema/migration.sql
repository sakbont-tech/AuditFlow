/*
  Warnings:

  - You are about to drop the column `accountType` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Transfer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ownerId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "accountType",
DROP COLUMN "currency",
DROP COLUMN "status",
ALTER COLUMN "balanceCents" SET DEFAULT 50000;

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "completedAt",
DROP COLUMN "currency",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "AccountStatus";

-- DropEnum
DROP TYPE "AccountType";

-- DropEnum
DROP TYPE "Currency";

-- DropEnum
DROP TYPE "TransferStatus";

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "transferId" UUID,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_ownerId_key" ON "Account"("ownerId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
