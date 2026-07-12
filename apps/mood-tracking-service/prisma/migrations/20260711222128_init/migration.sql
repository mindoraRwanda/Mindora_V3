-- CreateTable
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

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id","recorded_at")
);

-- CreateIndex
CREATE INDEX "mood_entries_user_id_recorded_at_idx" ON "mood_entries"("user_id", "recorded_at");
