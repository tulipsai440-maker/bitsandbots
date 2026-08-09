import {
  PRACTICE_END_HOUR,
  PRACTICE_HOUR,
  PRACTICE_MINUTE,
  PRACTICE_PLACE,
  PRACTICE_TITLE,
  ZOOM_END_HOUR,
  ZOOM_END_MINUTE,
  ZOOM_HOUR,
  ZOOM_MINUTE,
  ZOOM_PLACE,
  ZOOM_TITLE,
} from "@/lib/photos";

export type MeetingKind = "practice" | "zoom";

export type NextMeeting = {
  kind: MeetingKind;
  title: string;
  date: Date;
  endsAt: Date;
  place: string;
  timeLabel: string;
};

/** Inclusive last calendar day for recurring Sunday/Wednesday meetings. */
export const MEETINGS_END = Object.freeze({ year: 2027, month: 1, day: 28 });

/** End of Feb 28, 2027 local — no recurring meetings after this instant. */
export function getMeetingsEndDate(): Date {
  return new Date(MEETINGS_END.year, MEETINGS_END.month, MEETINGS_END.day, 23, 59, 59, 999);
}

/** First day of the last navigable calendar month (February 2027). */
export function getMeetingsEndMonth(): Date {
  return new Date(MEETINGS_END.year, MEETINGS_END.month, 1);
}

export function isOnOrBeforeMeetingsEnd(date: Date): boolean {
  return date.getTime() <= getMeetingsEndDate().getTime();
}

function atLocalTime(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Next occurrence of a weekday (0=Sun … 6=Sat) at hour:minute local time. */
export function getNextWeekdayDate(
  weekday: number,
  hour: number,
  minute: number,
  from = new Date(),
): Date {
  const next = atLocalTime(from, hour, minute);
  const day = next.getDay();
  let daysUntil = (weekday - day + 7) % 7;

  if (daysUntil === 0 && from.getTime() >= next.getTime()) {
    daysUntil = 7;
  }

  next.setDate(next.getDate() + daysUntil);
  return next;
}

export function getNextPracticeDate(from = new Date()): Date {
  return getNextWeekdayDate(0, PRACTICE_HOUR, PRACTICE_MINUTE, from);
}

export function getNextZoomDate(from = new Date()): Date {
  return getNextWeekdayDate(3, ZOOM_HOUR, ZOOM_MINUTE, from);
}

function formatTimeRange(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): string {
  const start = atLocalTime(new Date(), startHour, startMinute);
  const end = atLocalTime(new Date(), endHour, endMinute);
  const startLabel = start.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endLabel = end.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${startLabel}–${endLabel}`;
}

export function formatPracticeTime(): string {
  return formatTimeRange(PRACTICE_HOUR, PRACTICE_MINUTE, PRACTICE_END_HOUR, 0);
}

export function formatZoomTime(): string {
  return formatTimeRange(ZOOM_HOUR, ZOOM_MINUTE, ZOOM_END_HOUR, ZOOM_END_MINUTE);
}

/** Next Sunday team practice or Wednesday Zoom — whichever comes first (null past season end). */
export function getNextMeeting(from = new Date()): NextMeeting | null {
  if (from.getTime() > getMeetingsEndDate().getTime()) {
    return null;
  }

  const practiceDate = getNextPracticeDate(from);
  const zoomDate = getNextZoomDate(from);

  if (zoomDate.getTime() < practiceDate.getTime()) {
    if (!isOnOrBeforeMeetingsEnd(zoomDate)) return null;
    const endsAt = atLocalTime(zoomDate, ZOOM_END_HOUR, ZOOM_END_MINUTE);
    return {
      kind: "zoom",
      title: ZOOM_TITLE,
      date: zoomDate,
      endsAt,
      place: ZOOM_PLACE,
      timeLabel: formatZoomTime(),
    };
  }

  if (!isOnOrBeforeMeetingsEnd(practiceDate)) return null;
  const endsAt = atLocalTime(practiceDate, PRACTICE_END_HOUR, 0);
  return {
    kind: "practice",
    title: PRACTICE_TITLE,
    date: practiceDate,
    endsAt,
    place: PRACTICE_PLACE,
    timeLabel: formatPracticeTime(),
  };
}

/** Next meeting start (practice or Zoom), for callers that only need a Date. */
export function getNextMeetingDate(from = new Date()): Date | null {
  return getNextMeeting(from)?.date ?? null;
}

export function formatMeetingDate(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** @deprecated Prefer formatPracticeTime / getNextMeeting().timeLabel */
export function formatMeetingTime(): string {
  return formatPracticeTime();
}
