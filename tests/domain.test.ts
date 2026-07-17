import { describe, it, expect } from "vitest";
import {
  calculateDbAtDistance,
  calculateRadiusForThreshold,
  getNoiseCategory,
} from "../src/lib/domain/noise";
import { calculateHaversineDistance } from "../src/lib/domain/distance";
import { formatDistance } from "../src/lib/domain/formatter";
import { getEventTemporalStatus, sortEventsTemporally } from "../src/lib/domain/temporal";
import { parseEventFilters, serializeEventFilters } from "../src/lib/domain/filter";
import { getValidMapPosition } from "../src/lib/domain/coordinates";

describe("Map Coordinates", () => {
  it("accepts finite coordinates inside geographic bounds", () => {
    expect(getValidMapPosition(-7.9839, 112.6214)).toEqual([-7.9839, 112.6214]);
    expect(getValidMapPosition(-90, -180)).toEqual([-90, -180]);
    expect(getValidMapPosition(90, 180)).toEqual([90, 180]);
  });

  it.each([
    [NaN, 112],
    [-7, Infinity],
    [-91, 112],
    [91, 112],
    [-7, -181],
    [-7, 181],
    ["-7", "112"],
    [null, undefined],
  ])("rejects invalid map position (%s, %s)", (latitude, longitude) => {
    expect(getValidMapPosition(latitude, longitude)).toBeNull();
  });
});

describe("Noise Domain Model", () => {
  it("calculates dB at distance correctly", () => {
    // Expected at 100m from 125dB: 125 - 20 * log10(100) = 125 - 40 = 85
    expect(calculateDbAtDistance(125, 100)).toBeCloseTo(85, 2);
    // Expected at 500m from 125dB: 125 - 20 * log10(500) = 125 - 53.979 = 71.02
    expect(calculateDbAtDistance(125, 500)).toBeCloseTo(71.02, 2);
    // Expected at 1000m from 125dB: 125 - 20 * log10(1000) = 125 - 60 = 65
    expect(calculateDbAtDistance(125, 1000)).toBeCloseTo(65, 2);
  });

  it("handles distance <= 0 by clamping to 1m", () => {
    expect(calculateDbAtDistance(125, 0)).toBe(125);
    expect(calculateDbAtDistance(125, -10)).toBe(125);
  });

  it("handles NaN/Infinity inputs gracefully", () => {
    expect(calculateDbAtDistance(NaN, 100)).toBeNaN();
    expect(calculateDbAtDistance(125, NaN)).toBeNaN();
    expect(calculateDbAtDistance(Infinity, 100)).toBeNaN();
  });

  it("calculates radius for threshold correctly", () => {
    // 75dB from 125dB -> 316.22m
    expect(calculateRadiusForThreshold(125, 75)).toBeCloseTo(316.22, 1);
    // 65dB from 125dB -> 1000m
    expect(calculateRadiusForThreshold(125, 65)).toBeCloseTo(1000, 1);
    // 55dB from 125dB -> 3162.27m
    expect(calculateRadiusForThreshold(125, 55)).toBeCloseTo(3162.27, 1);
  });

  it("returns 1m if target Db is greater than source Db", () => {
    expect(calculateRadiusForThreshold(120, 125)).toBe(1);
  });

  it("gets noise category", () => {
    expect(getNoiseCategory(75)).toBe("DANGER");
    expect(getNoiseCategory(80)).toBe("DANGER");
    expect(getNoiseCategory(65)).toBe("WARNING");
    expect(getNoiseCategory(74.9)).toBe("WARNING");
    expect(getNoiseCategory(55)).toBe("SAFE");
    expect(getNoiseCategory(40)).toBe("SAFE");
    expect(getNoiseCategory(NaN)).toBe("UNKNOWN");
  });
});

describe("Distance Domain Model", () => {
  it("calculates Haversine distance correctly", () => {
    // Jakarta ( -6.2088, 106.8456) to Bandung (-6.9175, 107.6191)
    // Roughly 115-120 km
    const dist = calculateHaversineDistance(-6.2088, 106.8456, -6.9175, 107.6191);
    expect(dist).toBeGreaterThan(115000);
    expect(dist).toBeLessThan(120000);
  });

  it("handles identical coordinates", () => {
    expect(calculateHaversineDistance(-6.2, 106.8, -6.2, 106.8)).toBe(0);
  });

  it("handles invalid coordinates by returning NaN", () => {
    expect(calculateHaversineDistance(NaN, 106.8, -6.2, 106.8)).toBeNaN();
    expect(calculateHaversineDistance(-91, 106.8, -6.2, 106.8)).toBeNaN(); // lat > 90
    expect(calculateHaversineDistance(-6.2, 181, -6.2, 106.8)).toBeNaN(); // lon > 180
  });
});

describe("Formatter Domain Model", () => {
  it("formats distances below threshold in meters", () => {
    expect(formatDistance(500)).toBe("500 m");
    expect(formatDistance(999.9)).toBe("1000 m");
  });

  it("formats distances above threshold in km", () => {
    expect(formatDistance(1000)).toBe("1 km");
    expect(formatDistance(1500)).toBe("1.5 km");
    expect(formatDistance(1540)).toBe("1.5 km");
    expect(formatDistance(1550)).toBe("1.6 km"); // rounding
  });

  it("handles invalid formatting gracefully", () => {
    expect(formatDistance(NaN)).toBe("N/A");
    expect(formatDistance(-10)).toBe("N/A");
  });
});

describe("Temporal Domain Model", () => {
  const start = new Date("2026-07-15T10:00:00Z");
  const end = new Date("2026-07-16T10:00:00Z");

  it("gets temporal status correctly", () => {
    // Ongoing
    const nowOngoing = new Date("2026-07-15T12:00:00Z");
    expect(getEventTemporalStatus(start, end, nowOngoing)).toBe("ONGOING");

    // Upcoming
    const nowUpcoming = new Date("2026-07-14T10:00:00Z");
    expect(getEventTemporalStatus(start, end, nowUpcoming)).toBe("UPCOMING");

    // Past
    const nowPast = new Date("2026-07-17T10:00:00Z");
    expect(getEventTemporalStatus(start, end, nowPast)).toBe("PAST");
  });

  it("handles invalid dates", () => {
    expect(getEventTemporalStatus("invalid", end)).toBe("INVALID");
    // End before start
    expect(getEventTemporalStatus(end, start)).toBe("INVALID");
  });

  it("sorts events correctly", () => {
    const events = [
      { id: 1, startAt: "2026-07-18T10:00:00Z", endAt: "2026-07-19T10:00:00Z" }, // UPCOMING (Starts 18th)
      { id: 2, startAt: "2026-07-14T10:00:00Z", endAt: "2026-07-15T10:00:00Z" }, // PAST (Ended 15th)
      { id: 3, startAt: "2026-07-10T10:00:00Z", endAt: "2026-07-18T10:00:00Z" }, // ONGOING (Ends 18th)
      { id: 4, startAt: "2026-07-12T10:00:00Z", endAt: "2026-07-17T10:00:00Z" }, // ONGOING (Ends 17th)
      { id: 5, startAt: "2026-07-20T10:00:00Z", endAt: "2026-07-21T10:00:00Z" }, // UPCOMING (Starts 20th)
      { id: 6, startAt: "2026-07-10T10:00:00Z", endAt: "2026-07-11T10:00:00Z" }, // PAST (Ended 11th)
    ];

    const now = new Date("2026-07-16T12:00:00Z");
    const sorted = sortEventsTemporally(events, now);

    // Order should be:
    // 1. ONGOING (ending soonest): id 4 (ends 17th) -> id 3 (ends 18th)
    // 2. UPCOMING (starting soonest): id 1 (starts 18th) -> id 5 (starts 20th)
    // 3. PAST (ended most recently): id 2 (ended 15th) -> id 6 (ended 11th)
    expect(sorted.map(e => e.id)).toEqual([4, 3, 1, 5, 2, 6]);
  });
});

describe("Filter Domain Model", () => {
  it("parses valid URL params", () => {
    const params = new URLSearchParams("search=horeg&status=ONGOING&city=Malang&invalid=123");
    const filter = parseEventFilters(params);

    expect(filter).toEqual({
      search: "horeg",
      status: "ONGOING",
      city: "Malang"
    });
  });

  it("ignores empty or invalid status strings", () => {
    const params = new URLSearchParams("search=  &status=FAKE");
    const filter = parseEventFilters(params);

    expect(filter).toEqual({});
  });

  it("serializes filter state correctly", () => {
    const filter = { search: "horeg", status: "PAST" };
    const params = serializeEventFilters(filter);
    
    expect(params.toString()).toBe("search=horeg&status=PAST");
  });
});
