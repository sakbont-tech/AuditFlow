-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHEQUING', 'SAVINGS');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CAD', 'USD');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('COMPLETED', 'PENDING', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "balanceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" UUID NOT NULL,
    "sourceAccountId" UUID NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "destinationAccountId" UUID NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_accountNumber_key" ON "Account"("accountNumber");

-- CreateIndex
CREATE INDEX "Account_ownerId_idx" ON "Account"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_idempotencyKey_key" ON "Transfer"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Transfer_sourceAccountId_idx" ON "Transfer"("sourceAccountId");

-- CreateIndex
CREATE INDEX "Transfer_destinationAccountId_idx" ON "Transfer"("destinationAccountId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Account"
ADD CONSTRAINT "Account_balanceCents_nonnegative_check"
CHECK ("balanceCents" >= 0);

ALTER TABLE "Transfer"
ADD CONSTRAINT "Transfer_amountCents_positive_check"
CHECK ("amountCents" > 0);

ALTER TABLE "Transfer"
ADD CONSTRAINT "Transfer_distinct_accounts_check"
CHECK ("sourceAccountId" <> "destinationAccountId");