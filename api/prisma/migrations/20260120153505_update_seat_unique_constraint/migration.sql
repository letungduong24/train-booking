/*
  Warnings:

  - A unique constraint covering the columns `[coachId,rowIndex,colIndex,tier]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Seat_coachId_rowIndex_colIndex_key";

-- CreateIndex
CREATE UNIQUE INDEX "Seat_coachId_rowIndex_colIndex_tier_key" ON "Seat"("coachId", "rowIndex", "colIndex", "tier");
