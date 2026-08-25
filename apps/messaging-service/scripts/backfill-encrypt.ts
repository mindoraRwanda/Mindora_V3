/**
 * Encrypts message rows written before encryption was wired up.
 *
 * Messages were stored as plaintext because encryptContent() existed but was
 * never called on the write path. This walks both `messages.content` and the
 * denormalised `conversations.lastMessage.content` preview, encrypting
 * anything not already in the `iv:authTag:ciphertext` format.
 *
 * Idempotent — rows already encrypted are skipped, so it's safe to re-run.
 *
 *   npm run backfill:encrypt -w @mindora/messaging-service
 *   npm run backfill:encrypt -w @mindora/messaging-service -- --dry-run
 */
import mongoose from 'mongoose';
import { config as dotenvConfig } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Conversation, Message } from '../src/models/index.js';
import { encryptContent, isEncrypted } from '../src/utils/encryption.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig();

const DRY_RUN = process.argv.includes('--dry-run');

async function main(): Promise<void> {
  const uri =
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/mindora_messaging';
  await mongoose.connect(uri);
  console.log(`Connected to ${mongoose.connection.db?.databaseName}`);
  if (DRY_RUN) console.log('DRY RUN — no writes will be made\n');

  let messagesEncrypted = 0;
  let messagesSkipped = 0;

  const messages = await Message.find({}).select('_id content').lean();
  for (const m of messages) {
    if (isEncrypted(m.content)) {
      messagesSkipped++;
      continue;
    }
    if (!DRY_RUN) {
      await Message.updateOne(
        { _id: m._id },
        { $set: { content: encryptContent(m.content) } }
      );
    }
    messagesEncrypted++;
  }

  let previewsEncrypted = 0;
  let previewsSkipped = 0;

  const conversations = await Conversation.find({
    'lastMessage.content': { $exists: true, $ne: null },
  })
    .select('_id lastMessage')
    .lean();

  for (const c of conversations) {
    const content = c.lastMessage?.content;
    if (!content) continue;
    if (isEncrypted(content)) {
      previewsSkipped++;
      continue;
    }
    if (!DRY_RUN) {
      await Conversation.updateOne(
        { _id: c._id },
        { $set: { 'lastMessage.content': encryptContent(content) } }
      );
    }
    previewsEncrypted++;
  }

  console.log(
    `messages:      ${messagesEncrypted} encrypted, ${messagesSkipped} already encrypted`
  );
  console.log(
    `previews:      ${previewsEncrypted} encrypted, ${previewsSkipped} already encrypted`
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
