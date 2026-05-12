/*
  Warnings:

  - A unique constraint covering the columns `[code,version]` on the table `Route` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- DropIndex
DROP INDEX "Route_code_key";

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "status" "StationStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "Route_code_version_key" ON "Route"("code", "version");
