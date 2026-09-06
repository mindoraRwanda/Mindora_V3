-- The chatbot vendor's auth model changed from per-patient signup/login
-- (which needed a stored password to re-authenticate) to POST
-- /integration/session (a shared server-to-server key, no per-user
-- password). See src/chatbotClient.ts.
ALTER TABLE "chatbot_accounts" DROP COLUMN "chatbot_password";
