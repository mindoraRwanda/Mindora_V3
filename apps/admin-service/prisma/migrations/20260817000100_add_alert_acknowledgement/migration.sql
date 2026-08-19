-- AlterTable
ALTER TABLE "system_alerts" ADD COLUMN     "acknowledged_at" TIMESTAMP(3),
ADD COLUMN     "acknowledged_by" TEXT;

-- CreateIndex
CREATE INDEX "system_alerts_acknowledged_at_created_at_idx" ON "system_alerts"("acknowledged_at", "created_at");

