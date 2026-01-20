/*
  Warnings:

  - You are about to drop the column `date` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Trip` table. All the data in the column will be lost.
  - Added the required column `departureTime` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Trip_date_idx";

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "date",
DROP COLUMN "startTime",
ADD COLUMN     "departureTime" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Trip_departureTime_idx" ON "Trip"("departureTime");
