const BUSINESS_HOUR_START = 9;
const BUSINESS_HOUR_END = 17;
const SLOT_DURATION_MS = 60 * 60 * 1000;

export interface TimeSlot {
  slotStart: Date;
  slotEnd: Date;
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  blockedStart: Date,
  blockedEnd: Date
): boolean {
  return slotStart < blockedEnd && slotEnd > blockedStart;
}

export function generateCandidateSlots(from: Date, to: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const cursor = new Date(from);
  cursor.setUTCMinutes(0, 0, 0);

  if (cursor < from) {
    cursor.setUTCHours(cursor.getUTCHours() + 1);
  }

  while (cursor < to) {
    const hour = cursor.getUTCHours();
    if (hour >= BUSINESS_HOUR_START && hour < BUSINESS_HOUR_END) {
      const slotEnd = new Date(cursor.getTime() + SLOT_DURATION_MS);
      if (slotEnd <= to && cursor >= from) {
        slots.push({ slotStart: new Date(cursor), slotEnd });
      }
    }
    cursor.setUTCHours(cursor.getUTCHours() + 1);
  }

  return slots;
}

export function filterAvailableSlots(
  candidates: TimeSlot[],
  blocked: TimeSlot[]
): TimeSlot[] {
  return candidates.filter(
    (candidate) =>
      !blocked.some((booked) =>
        overlaps(
          candidate.slotStart,
          candidate.slotEnd,
          booked.slotStart,
          booked.slotEnd
        )
      )
  );
}

export function defaultAvailabilityRange(): { from: Date; to: Date } {
  const from = new Date();
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from, to };
}
