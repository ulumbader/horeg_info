export type TemporalStatus = "ONGOING" | "UPCOMING" | "PAST" | "INVALID";

/**
 * Determines the temporal status of an event based on a reference time (usually "now" in Asia/Jakarta).
 * @param startAt Event start time
 * @param endAt Event end time
 * @param now Reference time (optional, defaults to current time)
 */
export function getEventTemporalStatus(
  startAt: Date | string | number,
  endAt: Date | string | number,
  now: Date | number = new Date()
): TemporalStatus {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const current = new Date(now).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || Number.isNaN(current) || end <= start) {
    return "INVALID";
  }

  if (current >= start && current <= end) {
    return "ONGOING";
  }
  if (current < start) {
    return "UPCOMING";
  }
  return "PAST";
}

/**
 * A generic type representing an event with start and end times.
 */
export interface EventTemporal {
  startAt: Date | string | number;
  endAt: Date | string | number;
}

/**
 * Sorts events in a specific order:
 * 1. ONGOING (ending soonest first)
 * 2. UPCOMING (starting soonest first)
 * 3. PAST (ended most recently first)
 */
export function sortEventsTemporally<T extends EventTemporal>(
  events: T[],
  now: Date | number = new Date()
): T[] {
  return [...events].sort((a, b) => {
    const statusA = getEventTemporalStatus(a.startAt, a.endAt, now);
    const statusB = getEventTemporalStatus(b.startAt, b.endAt, now);

    const rank = { ONGOING: 1, UPCOMING: 2, PAST: 3, INVALID: 4 };

    if (rank[statusA] !== rank[statusB]) {
      return rank[statusA] - rank[statusB];
    }

    const startA = new Date(a.startAt).getTime();
    const startB = new Date(b.startAt).getTime();
    const endA = new Date(a.endAt).getTime();
    const endB = new Date(b.endAt).getTime();

    if (statusA === "ONGOING") {
      // Ending soonest first
      return endA - endB;
    }
    
    if (statusA === "UPCOMING") {
      // Starting soonest first
      return startA - startB;
    }
    
    if (statusA === "PAST") {
      // Ended most recently first
      return endB - endA;
    }

    return 0; // INVALID or same
  });
}
