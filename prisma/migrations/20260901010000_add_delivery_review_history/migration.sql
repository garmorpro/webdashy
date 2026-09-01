CREATE TABLE "DeliveryReview" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL,
    "stagingUrl" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'AWAITING',
    "feedback" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "DeliveryReview_pkey" PRIMARY KEY ("id")
);
INSERT INTO "DeliveryReview" ("id", "deliveryId", "cycle", "stagingUrl", "status", "feedback", "sentAt", "respondedAt")
SELECT CONCAT('legacy-', "id"), "id", 1, COALESCE("stagingUrl", "liveUrl"), "reviewStatus", "reviewFeedback", COALESCE("deliveredAt", "createdAt"), "reviewedAt"
FROM "Delivery"
WHERE "reviewToken" IS NOT NULL AND COALESCE("stagingUrl", "liveUrl") IS NOT NULL;

CREATE UNIQUE INDEX "DeliveryReview_deliveryId_cycle_key" ON "DeliveryReview"("deliveryId", "cycle");
CREATE INDEX "DeliveryReview_deliveryId_sentAt_idx" ON "DeliveryReview"("deliveryId", "sentAt");
ALTER TABLE "DeliveryReview" ADD CONSTRAINT "DeliveryReview_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
