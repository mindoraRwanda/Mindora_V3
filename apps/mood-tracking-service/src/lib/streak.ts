import type { MoodEntry } from '../generated/prisma/index.js';
import { addDays, daysBetween, ymdInTimeZone } from './local-day.js';

export interface StreakOptions {
  /**
   * The IANA zone the user's calendar days are measured in. Days are grouped
   * and compared in this zone, so two check-ins that are the same local day
   * count once, and consecutive local days count as consecutive.
   *
   * Defaults to UTC for callers with no user zone to hand (see the admin
   * summary route).
   */
  timeZone?: string;
  /** Injectable clock, so "is this streak still live?" is testable. */
  now?: Date;
}

export interface StreakResult {
  /** Length of the *current* run, or 0 when the run has already been broken. */
  streak: number;
  /** Local calendar date (YYYY-MM-DD) of the latest entry, live or not. */
  lastCheckedIn: string | null;
}

/**
 * Length of the user's current check-in streak.
 *
 * "Current" is the whole point. Counting the consecutive run that ends at the
 * most recent entry — without asking when that entry was — reports a streak
 * that never ends: someone who checked in twice last March still sees "2 days"
 * a year later, and a single entry from any point in the past reads as a live
 * 1-day streak. So the run is only counted when it is still running.
 *
 * Today keeps a streak alive; so does yesterday, because a streak you can
 * still save today has not been broken yet — that is the state the check-in
 * prompt is nudging. Anything older is a finished streak, and reports 0.
 *
 * `lastCheckedIn` is returned either way: the date of the last entry is still
 * worth showing once the streak itself is gone.
 */
export function calculateStreak(
  entries: Pick<MoodEntry, 'recordedAt'>[],
  options: StreakOptions = {}
): StreakResult {
  const timeZone = options.timeZone ?? 'UTC';
  const now = options.now ?? new Date();

  if (entries.length === 0) {
    return { streak: 0, lastCheckedIn: null };
  }

  // Group by local calendar day: several check-ins in one day are one day of
  // streak, and a 01:00 check-in in Kigali belongs to that local day rather
  // than to the previous UTC one.
  const daySet = new Set(
    entries.map((entry) => ymdInTimeZone(entry.recordedAt, timeZone))
  );
  // Lexicographic sort is chronological for YYYY-MM-DD.
  const sortedDays = [...daySet].sort().reverse();
  const lastCheckedIn = sortedDays[0] ?? null;

  if (!lastCheckedIn) {
    return { streak: 0, lastCheckedIn: null };
  }

  const today = ymdInTimeZone(now, timeZone);
  if (lastCheckedIn !== today && lastCheckedIn !== addDays(today, -1)) {
    return { streak: 0, lastCheckedIn };
  }

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i += 1) {
    if (daysBetween(sortedDays[i], sortedDays[i - 1]) !== 1) {
      break;
    }
    streak += 1;
  }

  return { streak, lastCheckedIn };
}
