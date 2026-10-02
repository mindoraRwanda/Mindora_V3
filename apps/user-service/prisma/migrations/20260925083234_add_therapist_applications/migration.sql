-- CreateEnum
CREATE TYPE "TherapistApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFORMATION_REQUIRED');

-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN     "application_id" UUID,
ADD COLUMN     "application_status" "TherapistApplicationStatus",
ADD COLUMN     "is_suspended" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "therapist_applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "TherapistApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "professional_bio" TEXT NOT NULL,
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "license_number" TEXT NOT NULL,
    "license_issuing_body" TEXT NOT NULL,
    "license_expiry_date" TIMESTAMP(3),
    "professional_registration_number" TEXT,
    "specialisations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "years_of_experience" INTEGER NOT NULL,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availability_summary" TEXT,
    "location" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_documents" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapist_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_application_notes" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapist_application_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "therapist_applications_user_id_idx" ON "therapist_applications"("user_id");

-- CreateIndex
CREATE INDEX "therapist_applications_status_idx" ON "therapist_applications"("status");

-- CreateIndex
CREATE INDEX "therapist_applications_submitted_at_idx" ON "therapist_applications"("submitted_at");

-- CreateIndex
CREATE INDEX "therapist_documents_application_id_idx" ON "therapist_documents"("application_id");

-- CreateIndex
CREATE INDEX "therapist_application_notes_application_id_idx" ON "therapist_application_notes"("application_id");

-- CreateIndex
CREATE INDEX "therapist_profiles_application_status_idx" ON "therapist_profiles"("application_status");

-- CreateIndex
CREATE INDEX "therapist_profiles_is_suspended_idx" ON "therapist_profiles"("is_suspended");

-- AddForeignKey
ALTER TABLE "therapist_documents" ADD CONSTRAINT "therapist_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "therapist_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_application_notes" ADD CONSTRAINT "therapist_application_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "therapist_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
