/*
  Warnings:

  - You are about to drop the column `pathCoordinates` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the `NetworkTrack` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Route" DROP COLUMN "pathCoordinates";

-- DropTable
DROP TABLE "NetworkTrack";

-- CreateTable
CREATE TABLE "RailwayLine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pathCoordinates" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RailwayLine_pkey" PRIMARY KEY ("id")
);
