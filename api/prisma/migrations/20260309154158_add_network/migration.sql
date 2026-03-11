/*
  Warnings:

  - You are about to drop the column `pathCoordinates` on the `RailwayNetwork` table. All the data in the column will be lost.
  - Added the required column `lines` to the `RailwayNetwork` table without a default value. This is not possible if the table is not empty.
  - Added the required column `points` to the `RailwayNetwork` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RailwayNetwork" DROP COLUMN "pathCoordinates",
ADD COLUMN     "lines" JSONB NOT NULL,
ADD COLUMN     "points" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "NetworkSegment" (
    "id" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "startStationId" TEXT,
    "endStationId" TEXT,
    "pathCoordinates" JSONB NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NetworkSegment_networkId_idx" ON "NetworkSegment"("networkId");

-- AddForeignKey
ALTER TABLE "NetworkSegment" ADD CONSTRAINT "NetworkSegment_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "RailwayNetwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
