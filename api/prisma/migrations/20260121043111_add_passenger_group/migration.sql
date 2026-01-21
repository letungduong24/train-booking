/*
  Warnings:

  - Added the required column `passengerGroupId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "passengerGroupId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PassengerGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassengerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PassengerGroup_code_key" ON "PassengerGroup"("code");

-- CreateIndex
CREATE INDEX "Ticket_passengerGroupId_idx" ON "Ticket"("passengerGroupId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_passengerGroupId_fkey" FOREIGN KEY ("passengerGroupId") REFERENCES "PassengerGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
