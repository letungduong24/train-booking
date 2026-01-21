/*
  Warnings:

  - Added the required column `tripId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Booking_status_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "tripId" TEXT NOT NULL,
ALTER COLUMN "totalPrice" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Booking_tripId_idx" ON "Booking"("tripId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
