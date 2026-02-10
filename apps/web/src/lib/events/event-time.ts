/**
 * Event time normalization helpers.
 *
 * Historical data uses mixed event schemas:
 * - startDate/endDate (Date or Firestore Timestamp)
 * - startAt/endAt (Firestore Timestamp)
 * - startTime/endTime (legacy string/date)
 */

type FirestoreTimestampLike = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
};

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

export function toEventDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isValidDate(parsed) ? parsed : null;
  }

  if (typeof value === 'object') {
    const maybeTimestamp = value as FirestoreTimestampLike;

    if (typeof maybeTimestamp.toDate === 'function') {
      const parsed = maybeTimestamp.toDate();
      return isValidDate(parsed) ? parsed : null;
    }

    const seconds =
      typeof maybeTimestamp.seconds === 'number'
        ? maybeTimestamp.seconds
        : maybeTimestamp._seconds;
    const nanos =
      typeof maybeTimestamp.nanoseconds === 'number'
        ? maybeTimestamp.nanoseconds
        : maybeTimestamp._nanoseconds || 0;

    if (typeof seconds === 'number') {
      const parsed = new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
      return isValidDate(parsed) ? parsed : null;
    }
  }

  return null;
}

export function getEventStartDate(eventData: Record<string, unknown>): Date | null {
  return (
    toEventDate(eventData.startDate) ??
    toEventDate(eventData.startAt) ??
    toEventDate(eventData.startTime) ??
    null
  );
}

export function getEventEndDate(eventData: Record<string, unknown>): Date | null {
  return (
    toEventDate(eventData.endDate) ??
    toEventDate(eventData.endAt) ??
    toEventDate(eventData.endTime) ??
    null
  );
}

export function toEventIso(value: unknown): string | null {
  const parsed = toEventDate(value);
  if (parsed) return parsed.toISOString();
  return typeof value === 'string' && value.length > 0 ? value : null;
}
