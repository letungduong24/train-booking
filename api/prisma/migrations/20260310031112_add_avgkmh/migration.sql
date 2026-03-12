-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "pathCoordinates" JSONB,
ADD COLUMN     "totalDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Train" ADD COLUMN     "averageSpeedKmH" INTEGER NOT NULL DEFAULT 60;
