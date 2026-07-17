import { getAdminDashboardStats } from "@/server/dal/event";
import { requireAdmin } from "@/server/auth";
import { FileText, CheckCircle, Clock, CalendarDays, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AnalyticsWidgets } from "@/components/admin/AnalyticsWidgets";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getAdminDashboardStats();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'Asia/Jakarta'
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Ringkasan status data SOUND HOREG.INFO.</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">Tambah Acara Baru</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Published */}
        <div className="motion-card rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium">Published</h3>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-3xl font-bold">{stats.published}</div>
          <p className="text-xs text-muted-foreground mt-1 text-green-600 dark:text-green-400">Aktif dan terlihat publik</p>
        </div>

        {/* Total Draft */}
        <div className="motion-card rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium">Draft</h3>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold">{stats.draft}</div>
          <p className="text-xs text-muted-foreground mt-1 text-amber-600 dark:text-amber-400">Menunggu publikasi</p>
        </div>

        {/* Ongoing / Upcoming */}
        <div className="motion-card rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium">Berjalan / Mendatang</h3>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold">{stats.ongoingUpcoming}</div>
          <p className="text-xs text-muted-foreground mt-1">Acara yang belum berakhir</p>
        </div>

        {/* Past */}
        <div className="motion-card rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium">Telah Selesai</h3>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">{stats.past}</div>
          <p className="text-xs text-muted-foreground mt-1">Acara yang sudah berakhir</p>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsWidgets />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="motion-card rounded-xl border bg-card shadow-sm p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> Acara Mendatang Terdekat
          </h3>
          {stats.upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada acara mendatang.</p>
          ) : (
            <div className="space-y-4">
              {stats.upcomingEvents.map((event) => (
                <div key={event.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{formatDate(event.startAt)}</p>
                    <p className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted mt-1 inline-block">
                      {event.publicationStatus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="motion-card rounded-xl border bg-card shadow-sm p-6">
          <h3 className="font-semibold mb-4">Statistik Total</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Total Record Database</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Arsip (Archived)</span>
              <span className="font-semibold">{stats.archived}</span>
            </div>
            {/* Audit log placeholder */}
            <div className="mt-8 pt-4 border-t">
              <p className="text-xs text-muted-foreground italic">Audit log belum tersedia (Fase lanjutan).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
