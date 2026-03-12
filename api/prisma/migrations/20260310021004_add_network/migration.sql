/*
  Warnings:

  - You are about to drop the `NetworkSegment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RailwayNetwork` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NetworkSegment" DROP CONSTRAINT "NetworkSegment_networkId_fkey";

-- DropTable
DROP TABLE "NetworkSegment";

-- DropTable
DROP TABLE "RailwayNetwork";

-- CreateTable
CREATE TABLE "NetworkTrack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pathCoordinates" JSONB NOT NULL,
    "length" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkTrack_pkey" PRIMARY KEY ("id")
);
