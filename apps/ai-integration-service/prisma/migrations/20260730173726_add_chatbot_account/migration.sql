-- CreateTable
CREATE TABLE "chatbot_accounts" (
    "id" TEXT NOT NULL,
    "mindora_user_id" TEXT NOT NULL,
    "chatbot_user_id" TEXT NOT NULL,
    "chatbot_email" TEXT NOT NULL,
    "chatbot_password" TEXT NOT NULL,
    "access_token" TEXT,
    "token_expires_at" TIMESTAMPTZ,
    "conversation_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chatbot_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_accounts_mindora_user_id_key" ON "chatbot_accounts"("mindora_user_id");
