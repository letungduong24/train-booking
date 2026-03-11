/*
  Warnings:

  - The primary key for the `RouteStation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `latitute` on the `Station` table. All the data in the column will be lost.
  - You are about to drop the column `longtitute` on the `Station` table. All the data in the column will be lost.
  - Added the required column `latitude` to the `Station` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Station` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RouteStation" DROP CONSTRAINT "RouteStation_pkey",
ADD CONSTRAINT "RouteStation_pkey" PRIMARY KEY ("routeId", "stationId");

-- AlterTable
ALTER TABLE "Station" DROP COLUMN "latitute",
DROP COLUMN "longtitute",
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL;
