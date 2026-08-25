-- Durable record of crisis detections, written before the user is answered.
-- Previously a Level 5 disclosure existed only as a fire-and-forget RabbitMQ
-- publish, so a broker outage meant no record of it existed anywhere.
CREATE TABLE "crisis_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "crisis_level" SMALLINT NOT NULL,
    "detected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,

    CONSTRAINT "crisis_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "crisis_alerts_published_detected_at_idx" ON "crisis_alerts"("published", "detected_at");
CREATE INDEX "crisis_alerts_user_id_idx" ON "crisis_alerts"("user_id");
