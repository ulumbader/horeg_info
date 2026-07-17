import { requireAdmin } from "@/server/auth";
import { getAdminAuditLogs } from "@/server/dal/audit";
import { getAppSetting } from "@/server/dal/settings";
import { ProfileSettings } from "@/components/admin/settings/ProfileSettings";
import { SecuritySettings } from "@/components/admin/settings/SecuritySettings";
import { AppSettingsForm } from "@/components/admin/settings/AppSettingsForm";
import { Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const search = typeof params.search === "string" ? params.search : undefined;

  const { items: auditLogs, totalPages } = await getAdminAuditLogs(page, 10, search);

  const announcement = await getAppSetting("APP_HEADER_ANNOUNCEMENT", "");
  const contact = await getAppSetting("APP_PUBLIC_CONTACT", "");

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-muted-foreground text-sm">Kelola profil, keamanan, preferensi aplikasi, dan tinjau log aktivitas admin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KOLOM KIRI: Profil & App Settings */}
        <div className="space-y-6">
          <div className="motion-card bg-card p-6 rounded-xl border shadow-sm">
            <ProfileSettings currentName={session.user.name} currentEmail={session.user.email} />
          </div>

          <div className="motion-card bg-card p-6 rounded-xl border shadow-sm">
            <AppSettingsForm defaultSettings={{
              "APP_HEADER_ANNOUNCEMENT": announcement,
              "APP_PUBLIC_CONTACT": contact
            }} />
          </div>
        </div>

        {/* KOLOM KANAN: Keamanan */}
        <div className="space-y-6">
          <div className="motion-card bg-card p-6 rounded-xl border shadow-sm">
            <SecuritySettings />
          </div>
        </div>
      </div>

      {/* LOG AUDIT BAWAH */}
      <div className="motion-card bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/10">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Log Aktivitas Admin</h3>
          </div>
          <form method="GET" action="/admin/settings" className="flex items-center w-full md:w-auto relative">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <Input 
              name="search"
              defaultValue={search}
              placeholder="Filter log..." 
              className="pl-9 h-9 w-full md:w-64 bg-background"
            />
          </form>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Waktu (Asia/Jakarta)</th>
                <th className="px-6 py-3 font-medium">Jenis Aktivitas</th>
                <th className="px-6 py-3 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    Tidak ada log aktivitas.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground font-mono">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION LOGS */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center bg-muted/5">
            <div className="text-sm text-muted-foreground">
              Hal {page} dari {totalPages}
            </div>
            <div className="flex gap-2">
              <Button 
                className="bg-transparent border border-input text-foreground hover:bg-accent h-8 px-3 text-xs"
                disabled={page <= 1} 
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={`/admin/settings?page=${page - 1}${search ? `&search=${search}` : ''}`}>Prev</Link>
                ) : <span>Prev</span>}
              </Button>
              <Button 
                className="bg-transparent border border-input text-foreground hover:bg-accent h-8 px-3 text-xs"
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={`/admin/settings?page=${page + 1}${search ? `&search=${search}` : ''}`}>Next</Link>
                ) : <span>Next</span>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
