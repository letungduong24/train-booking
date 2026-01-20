/*
  Warnings:

  - Added the required column `endTime` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "turnaroundMinutes" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL;
