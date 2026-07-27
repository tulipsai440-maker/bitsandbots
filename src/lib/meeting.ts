const MEETING_HOUR = 19;
const MEETING_MINUTE = 0;

/** Next Wednesday troop meeting at 7:00 PM local time. */
export function getNextMeetingDate(from = new Date()): Date {
  const next = new Date(from);
  next.setHours(MEETING_HOUR, MEETING_MINUTE, 0, 0);

  const day = next.getDay();
  let daysUntilWednesday = (3 - day + 7) % 7;

  if (daysUntilWednesday === 0 && from.getTime() >= next.getTime()) {
    daysUntilWednesday = 7;
  }

  next.setDate(next.getDate() + daysUntilWednesday);
  return next;
}

export function formatMeetingDate(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatMeetingTime(): string {
  const sample = new Date();
  sample.setHours(MEETING_HOUR, MEETING_MINUTE, 0, 0);
  return sample.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
