-- AddCheckConstraint
-- Enforces that crisis_level is always in the 0–5 range produced by runPreFilter.
-- Prisma 6 does not support @@check in the schema language; this constraint is
-- applied directly and documented via a comment in prisma/schema.prisma.
ALTER TABLE "ai_interactions"
  ADD CONSTRAINT "ai_interactions_crisis_level_check"
  CHECK (crisis_level >= 0 AND crisis_level <= 5);
