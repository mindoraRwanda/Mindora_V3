-- CreateTable
CREATE TABLE "ai_interactions" (
    "id"             TEXT        NOT NULL,
    "user_id"        TEXT        NOT NULL,
    "session_id"     TEXT        NOT NULL,
    "user_message"   TEXT        NOT NULL,
    "ai_response"    TEXT        NOT NULL,
    "input_flagged"  BOOLEAN     NOT NULL DEFAULT false,
    "output_flagged" BOOLEAN     NOT NULL DEFAULT false,
    "crisis_level"   SMALLINT    NOT NULL,
    "tokens_used"    INTEGER,
    "response_ms"    INTEGER,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);
