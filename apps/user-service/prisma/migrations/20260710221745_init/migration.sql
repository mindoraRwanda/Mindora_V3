-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_name" TEXT,
    "bio" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language_preference" TEXT NOT NULL DEFAULT 'en',
    "fcm_token" TEXT,
    "notification_preferences" JSONB NOT NULL DEFAULT '{"push": true, "email": true, "sms": true}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_name" TEXT,
    "bio" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language_preference" TEXT NOT NULL DEFAULT 'en',
    "specialisation" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_accepting_patients" BOOLEAN NOT NULL DEFAULT true,
    "fcm_token" TEXT,
    "notification_preferences" JSONB NOT NULL DEFAULT '{"push": true, "email": true, "sms": true}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_user_id_key" ON "patient_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "therapist_profiles_user_id_key" ON "therapist_profiles"("user_id");

-- CreateIndex
CREATE INDEX "therapist_profiles_is_accepting_patients_idx" ON "therapist_profiles"("is_accepting_patients");

-- CreateIndex
CREATE INDEX "therapist_profiles_specialisation_idx" ON "therapist_profiles"("specialisation");
