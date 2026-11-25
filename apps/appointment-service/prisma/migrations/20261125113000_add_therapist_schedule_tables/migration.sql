-- Add the therapist availability tables used by appointment.routes.ts.
-- Additive only: this migration creates missing tables/indexes and does not
-- modify or delete existing appointment or patient data.

CREATE TABLE IF NOT EXISTS "therapist_schedules" (
    "therapist_id" UUID NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali',
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "therapist_schedules_pkey" PRIMARY KEY ("therapist_id")
);

CREATE TABLE IF NOT EXISTS "therapist_working_hours" (
    "id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    CONSTRAINT "therapist_working_hours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "therapist_time_off" (
    "id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "therapist_time_off_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "therapist_working_hours_therapist_id_idx"
    ON "therapist_working_hours"("therapist_id");

CREATE INDEX IF NOT EXISTS "therapist_time_off_therapist_id_starts_at_idx"
    ON "therapist_time_off"("therapist_id", "starts_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'therapist_working_hours_therapist_id_fkey'
    ) THEN
        ALTER TABLE "therapist_working_hours"
            ADD CONSTRAINT "therapist_working_hours_therapist_id_fkey"
            FOREIGN KEY ("therapist_id")
            REFERENCES "therapist_schedules"("therapist_id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'therapist_time_off_therapist_id_fkey'
    ) THEN
        ALTER TABLE "therapist_time_off"
            ADD CONSTRAINT "therapist_time_off_therapist_id_fkey"
            FOREIGN KEY ("therapist_id")
            REFERENCES "therapist_schedules"("therapist_id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
