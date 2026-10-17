import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPageViewStats, recordPageView } from "@/server/dal/analytics";

const pageView = vi.hoisted(() => ({
  upsert: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { pageView } }));

describe("statistik kunjungan WIB", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it.each([
    ["2026-12-31T16:59:59Z", "2026-12-31"],
    ["2026-12-31T17:00:00Z", "2027-01-01"],
  ])("mencatat tanggal lokal pada %s", async (now, date) => {
    vi.setSystemTime(new Date(now));
    await recordPageView("/");
    expect(pageView.upsert).toHaveBeenCalledWith({
      where: { path_date: { path: "/", date } },
      update: { count: { increment: 1 } },
      create: { path: "/", date, count: 1 },
    });
  });

  it("mengakhiri tren pada hari ini WIB dan mengisi hari tanpa data dengan nol", async () => {
    vi.setSystemTime(new Date("2026-12-31T17:00:00Z"));
    pageView.aggregate.mockResolvedValueOnce({ _sum: { count: 8521 } })
      .mockResolvedValueOnce({ _sum: { count: 31 } });
    pageView.groupBy.mockResolvedValue([
      { date: "2026-12-28", _sum: { count: 62 } },
      { date: "2027-01-01", _sum: { count: 31 } },
    ]);

    const stats = await getPageViewStats();
    expect(stats).toEqual({
      totalAllTime: 8521,
      totalToday: 31,
      dailyViews: [
        { date: "2026-12-26", count: 0 },
        { date: "2026-12-27", count: 0 },
        { date: "2026-12-28", count: 62 },
        { date: "2026-12-29", count: 0 },
        { date: "2026-12-30", count: 0 },
        { date: "2026-12-31", count: 0 },
        { date: "2027-01-01", count: 31 },
      ],
    });
    expect(pageView.aggregate).toHaveBeenLastCalledWith({
      where: { date: "2027-01-01" }, _sum: { count: true },
    });
    expect(pageView.groupBy).toHaveBeenCalledWith({
      by: ["date"],
      where: { date: { in: stats.dailyViews.map((day) => day.date) } },
      _sum: { count: true },
      orderBy: { date: "asc" },
    });
  });

  it("mengembalikan nol saat belum ada kunjungan", async () => {
    vi.setSystemTime(new Date("2026-10-18T05:00:00Z"));
    pageView.aggregate.mockResolvedValue({ _sum: { count: null } });
    pageView.groupBy.mockResolvedValue([]);
    const stats = await getPageViewStats();
    expect(stats.totalAllTime).toBe(0);
    expect(stats.totalToday).toBe(0);
    expect(stats.dailyViews).toHaveLength(7);
    expect(stats.dailyViews.every((day) => day.count === 0)).toBe(true);
  });
});
