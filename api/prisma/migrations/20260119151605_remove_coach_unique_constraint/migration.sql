-- DropIndex
DROP INDEX "Coach_trainId_order_key";

-- CreateIndex
CREATE INDEX "Coach_trainId_idx" ON "Coach"("trainId");
