/*
  Warnings:

  - The primary key for the `RouteStation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Coaches` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[coachId,rowIndex,colIndex]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Train` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `colIndex` to the `Seat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Seat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rowIndex` to the `Seat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Train` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CoachLayout" AS ENUM ('SEAT', 'BED');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'LOCKED', 'DISABLED');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('VIP', 'STANDARD', 'ECONOMY', 'OTHER');

-- DropForeignKey
ALTER TABLE "Coaches" DROP CONSTRAINT "Coaches_trainId_fkey";

-- DropForeignKey
ALTER TABLE "Seat" DROP CONSTRAINT "Seat_coachId_fkey";

-- AlterTable
ALTER TABLE "RouteStation" DROP CONSTRAINT "RouteStation_pkey",
ADD CONSTRAINT "RouteStation_pkey" PRIMARY KEY ("routeId", "index");

-- AlterTable
ALTER TABLE "Seat" ADD COLUMN     "colIndex" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "rowIndex" INTEGER NOT NULL,
ADD COLUMN     "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "type" "SeatType" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "Train" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "Coaches";

-- CreateTable
CREATE TABLE "CoachTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" "CoachLayout" NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "totalCols" INTEGER NOT NULL,
    "tiers" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "trainId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachTemplate_code_key" ON "CoachTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_trainId_order_key" ON "Coach"("trainId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_coachId_rowIndex_colIndex_key" ON "Seat"("coachId", "rowIndex", "colIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Train_code_key" ON "Train"("code");

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CoachTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
