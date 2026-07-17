"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Eye, TrendingUp, BarChart3 } from "lucide-react";

interface AnalyticsData {
  totalAllTime: number;
  totalToday: number;
  dailyViews: { date: string; count: number }[];
  onlineVisitors: number;
}

const POLL_INTERVAL = 15_000; // 15 seconds

/**
 * Mini bar chart rendered with pure CSS.
 * Shows the last 7 days of page views.
 */
function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-16 mt-3" role="img" aria-label="Grafik kunjungan 7 hari terakhir">
      {data.map((day) => {
        const heightPercent = (day.count / maxCount) * 100;
        const dayLabel = new Date(day.date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short" });
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full relative group">
              <div
                className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors duration-150 min-h-[2px]"
                style={{ height: `${Math.max(heightPercent, 3)}%` }}
                title={`${dayLabel}: ${day.count} kunjungan`}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                <div className="bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-md whitespace-nowrap border">
                  {day.count}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground leading-none">{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Live pulse indicator for online visitors count.
 */
function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  );
}

/**
 * Admin dashboard analytics widgets.
 * Polls the analytics stats API every 15 seconds.
 */
export function AnalyticsWidgets() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/stats", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const json: AnalyticsData = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRequest = window.setTimeout(() => void fetchStats(), 0);

    const interval = window.setInterval(() => void fetchStats(), POLL_INTERVAL);
    return () => {
      window.clearTimeout(initialRequest);
      window.clearInterval(interval);
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <>
        <AnalyticsCardSkeleton />
        <AnalyticsCardSkeleton />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <div className="motion-card rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col col-span-1">
          <p className="text-sm text-muted-foreground">Gagal memuat data analitik.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Online Visitors Card */}
      <div className="motion-card rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="tracking-tight text-sm font-medium">Pengunjung Online</h3>
          <div className="flex items-center gap-2">
            <LivePulse />
            <Users className="w-4 h-4 text-green-500" />
          </div>
        </div>
        <div className="text-3xl font-bold">{data.onlineVisitors}</div>
        <p className="text-xs text-muted-foreground mt-1 text-green-600 dark:text-green-400">
          Browser aktif saat ini
        </p>
      </div>

      {/* Page Views Card */}
      <div className="motion-card rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="tracking-tight text-sm font-medium">Kunjungan Hari Ini</h3>
          <Eye className="w-4 h-4 text-primary" />
        </div>
        <div className="text-3xl font-bold">{data.totalToday.toLocaleString("id-ID")}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Total sepanjang waktu: <span className="font-semibold text-foreground">{data.totalAllTime.toLocaleString("id-ID")}</span>
        </p>
      </div>

      {/* Weekly Chart Card — spans 2 columns on larger grids */}
      <div className="motion-card rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col md:col-span-2">
        <div className="flex flex-row items-center justify-between pb-1">
          <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Tren Kunjungan 7 Hari
          </h3>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <MiniBarChart data={data.dailyViews} />
      </div>
    </>
  );
}

function AnalyticsCardSkeleton() {
  return (
    <div className="motion-card rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col animate-pulse">
      <div className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-4 w-4 bg-muted rounded" />
      </div>
      <div className="h-8 w-16 bg-muted rounded mt-1" />
      <div className="h-3 w-32 bg-muted rounded mt-2" />
    </div>
  );
}
