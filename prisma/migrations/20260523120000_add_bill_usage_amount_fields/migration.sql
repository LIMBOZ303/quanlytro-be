-- AlterTable
ALTER TABLE "MonthlyBill" ADD COLUMN "electricityUsage" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "MonthlyBill" ADD COLUMN "electricityAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "MonthlyBill" ADD COLUMN "waterUsage" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "MonthlyBill" ADD COLUMN "waterAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill existing rows from meter readings and prices
UPDATE "MonthlyBill"
SET
  "electricityUsage" = "electricityNew" - "electricityOld",
  "electricityAmount" = ("electricityNew" - "electricityOld") * "electricityPrice",
  "waterUsage" = "waterNew" - "waterOld",
  "waterAmount" = ("waterNew" - "waterOld") * "waterPrice";
