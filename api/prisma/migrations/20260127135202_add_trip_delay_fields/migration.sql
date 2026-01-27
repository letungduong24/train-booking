-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "arrivalDelayMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "departureDelayMinutes" INTEGER NOT NULL DEFAULT 0;
