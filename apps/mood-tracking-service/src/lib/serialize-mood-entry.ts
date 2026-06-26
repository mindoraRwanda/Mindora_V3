import type { MoodEntry } from '@mindora/database';
import { decryptJournalNote } from './journal-crypto.js';

export function serializeMoodEntry(
  entry: MoodEntry,
  options: { includeJournal?: boolean } = {}
) {
  let journalNote: string | null = null;
  if (options.includeJournal && entry.journalNoteEncrypted) {
    try {
      journalNote = decryptJournalNote(entry.journalNoteEncrypted);
    } catch {
      journalNote = null;
    }
  }

  return {
    id: entry.id,
    userId: entry.userId,
    moodScore: entry.moodScore,
    emotions: entry.emotions,
    sleepHours: entry.sleepHours,
    stressLevel: entry.stressLevel,
    energyLevel: entry.energyLevel,
    journalNote,
    triggers: entry.triggers,
    recordedAt: entry.recordedAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
  };
}
