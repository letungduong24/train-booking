/*
  Warnings:

  - You are about to drop the column `status` on the `Station` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Station" DROP COLUMN "status";

-- DropEnum
DROP TYPE "StationStatus";
