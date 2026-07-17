import { prisma } from "@/lib/prisma";
import "server-only";

/**
 * Record a page view for the given path on today's date.
 * Uses upsert to increment the daily counter atomically.
 */
export async function recordPageView(path: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  await prisma.pageView.upsert({
    where: { path_date: { path, date: today } },
    update: { count: { increment: 1 } },
    create: { path, date: today, count: 1 },
  });
}

/**
 * Upsert an active visitor heartbeat.
 * Also cleans up stale visitors older than 2 minutes.
 */
export async function upsertActiveVisitor(
  visitorId: string,
  path: string,
  userAgent?: string
): Promise<void> {
  const now = new Date();

  await prisma.activeVisitor.upsert({
    where: { id: visitorId },
    update: { lastSeen: now, path, userAgent: userAgent ?? null },
    create: { id: visitorId, lastSeen: now, path, userAgent: userAgent ?? null },
  });

  // Cleanup stale visitors (lastSeen > 2 minutes ago)
  const staleThreshold = new Date(now.getTime() - 2 * 60 * 1000);
  await prisma.activeVisitor.deleteMany({
    where: { lastSeen: { lt: staleThreshold } },
  });
}

/**
 * Count visitors that have sent a heartbeat in the last 60 seconds.
 */
export async function getOnlineVisitorCount(): Promise<number> {
  const threshold = new Date(Date.now() - 60 * 1000);
  return prisma.activeVisitor.count({
    where: { lastSeen: { gte: threshold } },
  });
}

/**
 * Get page view statistics for admin dashboard.
 */
export async function getPageViewStats() {
  const today = new Date().toISOString().slice(0, 10);

  // Generate last 7 days date strings
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().slice(0, 10));
  }

  const [allTimeAgg, todayAgg, weeklyData] = await Promise.all([
    // Total all-time page views
    prisma.pageView.aggregate({
      _sum: { count: true },
    }),
    // Today's page views
    prisma.pageView.aggregate({
      where: { date: today },
      _sum: { count: true },
    }),
    // Last 7 days breakdown
    prisma.pageView.groupBy({
      by: ["date"],
      where: { date: { in: last7Days } },
      _sum: { count: true },
      orderBy: { date: "asc" },
    }),
  ]);

  // Fill in missing days with zero
  const dailyViews = last7Days.map((date) => {
    const found = weeklyData.find((d) => d.date === date);
    return {
      date,
      count: found?._sum?.count ?? 0,
    };
  });

  return {
    totalAllTime: allTimeAgg._sum?.count ?? 0,
    totalToday: todayAgg._sum?.count ?? 0,
    dailyViews,
  };
}

/**
 * Get combined analytics stats for admin dashboard.
 */
export async function getAnalyticsStats() {
  const [pageViewStats, onlineCount] = await Promise.all([
    getPageViewStats(),
    getOnlineVisitorCount(),
  ]);

  return {
    ...pageViewStats,
    onlineVisitors: onlineCount,
  };
}
