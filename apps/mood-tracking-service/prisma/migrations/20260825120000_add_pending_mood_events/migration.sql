-- Durable outbox for mood.concern and mood.streak events. Previously a
-- fire-and-forget RabbitMQ publish with no record if delivery failed — same
-- pattern as crisis_alerts in ai-integration-service.
CREATE TABLE "pending_mood_events" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,

    CONSTRAINT "pending_mood_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pending_mood_events_published_created_at_idx" ON "pending_mood_events"("published", "created_at");
