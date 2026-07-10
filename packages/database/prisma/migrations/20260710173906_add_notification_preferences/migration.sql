-- AlterTable
ALTER TABLE "patient_profiles" ADD COLUMN     "notification_preferences" JSONB NOT NULL DEFAULT '{"push": true, "email": true, "sms": true}';

-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN     "notification_preferences" JSONB NOT NULL DEFAULT '{"push": true, "email": true, "sms": true}';
