-- AlterTable
ALTER TABLE "MonthlyBill" ADD COLUMN     "waterBillingType" TEXT NOT NULL DEFAULT 'METER',
ADD COLUMN     "waterPeopleCount" INTEGER,
ALTER COLUMN "electricityUsage" DROP DEFAULT,
ALTER COLUMN "electricityAmount" DROP DEFAULT,
ALTER COLUMN "waterUsage" DROP NOT NULL,
ALTER COLUMN "waterUsage" DROP DEFAULT,
ALTER COLUMN "waterAmount" DROP DEFAULT;
