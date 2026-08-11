-- CreateTable (works on plain PostgreSQL and TimescaleDB)
CREATE TABLE "mood_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "mood_score" INTEGER NOT NULL,
    "emotions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sleep_hours" DOUBLE PRECISION,
    "stress_level" INTEGER,
    "energy_level" INTEGER,
    "journal_note_encrypted" TEXT,
    "triggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id", "recorded_at")
);

-- CreateIndex
CREATE INDEX "mood_entries_user_id_recorded_at_idx" ON "mood_entries"("user_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TimescaleDB hypertable (optional — skipped in CI/plain Postgres; enabled in docker-compose)
DO $timescale$
BEGIN
  CREATE EXTENSION IF NOT EXISTS timescaledb;
  PERFORM create_hypertable('mood_entries', 'recorded_at', if_not_exists => TRUE);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'TimescaleDB hypertable skipped: %', SQLERRM;
END
$timescale$;
