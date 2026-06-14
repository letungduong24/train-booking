-- Keep the newest duplicate payment transaction per gateway reference before adding the unique index.
WITH ranked_transactions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "referenceId", "type", "paymentMethod"
      ORDER BY "createdAt" DESC, id DESC
    ) AS rn
  FROM "Transaction"
  WHERE "referenceId" IS NOT NULL
    AND "type" = 'PAYMENT'
    AND "paymentMethod" = 'VNPAY'
)
DELETE FROM "Transaction" t
USING ranked_transactions r
WHERE t.id = r.id
  AND r.rn > 1;

-- Keep the newest duplicate ticket per booking and seat before adding the unique index.
WITH ranked_tickets AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "bookingId", "seatId"
      ORDER BY "createdAt" DESC, id DESC
    ) AS rn
  FROM "Ticket"
)
DELETE FROM "Ticket" t
USING ranked_tickets r
WHERE t.id = r.id
  AND r.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_vnpay_payment_reference_key"
ON "Transaction"("referenceId")
WHERE "referenceId" IS NOT NULL
  AND "type" = 'PAYMENT'
  AND "paymentMethod" = 'VNPAY';

-- CreateIndex
CREATE INDEX "SeatIssueReport_tripId_seatId_status_idx" ON "SeatIssueReport"("tripId", "seatId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_bookingId_seatId_key" ON "Ticket"("bookingId", "seatId");
