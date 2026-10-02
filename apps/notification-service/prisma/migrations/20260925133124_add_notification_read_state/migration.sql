-- AlterTable
ALTER TABLE "notification_logs" ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notification_logs_userId_readAt_idx" ON "notification_logs"("userId", "readAt");
