// Calendar-day boundaries in an arbitrary IANA time zone, expressed as UTC
// instants so they can be handed straight to a `recorded_at` range query.
//
// Needed because "did I check in today?" is only answerable in the user's own
// zone: a Kigali user (UTC+3) checking in at 01:00 local is still on the
// previous UTC day, so a naive UTC comparison reports the wrong answer for the
// first three hours of every day.

/** The calendar date (YYYY-MM-DD) that `instant` falls on in `timeZone`. */
function ymdInTimeZone(instant: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD, which is already the shape we want.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** `timeZone`'s UTC offset, in ms, at the moment `instant`. */
function offsetMsAt(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const at = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  // Re-read the local wall-clock reading as though it were UTC; the gap
  // between that and the true instant is the offset.
  const asIfUtc = Date.UTC(
    at('year'),
    at('month') - 1,
    at('day'),
    at('hour'),
    at('minute'),
    at('second')
  );
  // Drop sub-second precision on both sides — formatToParts has none.
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** The UTC instant of local midnight starting the calendar day `ymd`. */
function localMidnightUtc(ymd: string, timeZone: string): Date {
  const asIfUtc = Date.parse(`${ymd}T00:00:00Z`);
  // First pass uses the offset at the same wall-clock reading in UTC; a second
  // pass re-derives it at the candidate instant so DST transitions (where the
  // offset before and after midnight differ) settle on the right side.
  const firstPass = asIfUtc - offsetMsAt(new Date(asIfUtc), timeZone);
  return new Date(asIfUtc - offsetMsAt(new Date(firstPass), timeZone));
}

function addDays(ymd: string, days: number): string {
  const next = new Date(Date.parse(`${ymd}T00:00:00Z`));
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export interface LocalDayRange {
  /** Inclusive lower bound. */
  start: Date;
  /** Exclusive upper bound — the next local day's midnight, so DST-short and
   *  DST-long days (23h/25h) are both covered exactly. */
  end: Date;
  /** The local calendar date this range represents, as YYYY-MM-DD. */
  localDate: string;
}

export function localDayRange(instant: Date, timeZone: string): LocalDayRange {
  const localDate = ymdInTimeZone(instant, timeZone);
  return {
    start: localMidnightUtc(localDate, timeZone),
    end: localMidnightUtc(addDays(localDate, 1), timeZone),
    localDate,
  };
}
