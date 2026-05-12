/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Route` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Station` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Route` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Station` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Route_code_key" ON "Route"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Station_code_key" ON "Station"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
