import { requireAdmin } from "@/server/auth";
import { getAdminEvents } from "@/server/dal/event";
import { Calendar, Search, Plus, MapPin, FileText, CheckCircle, Volume2 } from "lucide-react";
import Link from "next/link";
import Form from "next/form";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const search = typeof params.search === "string" ? params.search : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  
  const { items, total, totalPages } = await getAdminEvents(page, 10, search, status);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Acara</h1>
          <p className="text-muted-foreground text-sm">Kelola data acara Sound Horeg ({total} total).</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Acara
          </Link>
        </Button>
      </div>

      <div className="motion-card flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
        <Form action="/admin/events" className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              name="search"
              defaultValue={search}
              placeholder="Cari judul, kota..." 
              className="pl-9 bg-background"
            />
          </div>
          <select 
            name="status" 
            defaultValue={status || "ALL"}
            className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ALL">Semua Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">Filter</button>
        </Form>
      </div>

      <div className="motion-card rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Acara</th>
                <th className="px-6 py-4 font-medium">Waktu (Asia/Jakarta)</th>
                <th className="px-6 py-4 font-medium">Lokasi</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Tidak ada acara yang ditemukan.
                  </td>
                </tr>
              ) : (
                items.map((event) => (
                  <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{event.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{event.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {formatDate(event.startAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {event.city}
                        {!!event.audioSize && event.audioSize > 0 && (
                          <Volume2 className="w-3.5 h-3.5 text-primary shrink-0 ml-1" aria-label="Terdapat musik pengiring" role="img" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {event.publicationStatus === "PUBLISHED" ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 shadow-none px-2 py-0.5">
                          <CheckCircle className="w-3 h-3 mr-1.5" /> Published
                        </Badge>
                      ) : event.publicationStatus === "DRAFT" ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none px-2 py-0.5">
                          <FileText className="w-3 h-3 mr-1.5" /> Draft
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="px-2 py-0.5 text-muted-foreground shadow-none">
                          Archived
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button className="bg-transparent text-foreground hover:bg-muted text-sm h-8 px-3" asChild>
                        <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-border">
          {items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Tidak ada acara yang ditemukan.
            </div>
          ) : (
            items.map((event) => (
              <div key={event.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      {event.city}
                      {!!event.audioSize && event.audioSize > 0 && (
                        <Volume2 className="w-3.5 h-3.5 text-primary ml-1" aria-label="Terdapat musik pengiring" role="img" />
                      )}
                    </p>
                  </div>
                  {event.publicationStatus === "PUBLISHED" ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 shadow-none shrink-0 text-[10px]">
                      <CheckCircle className="w-3 h-3 mr-1" /> Published
                    </Badge>
                  ) : event.publicationStatus === "DRAFT" ? (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none shrink-0 text-[10px]">
                      <FileText className="w-3 h-3 mr-1" /> Draft
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-[10px]">Archived</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(event.startAt).split(',')[0]}
                  </span>
                  <Button className="bg-transparent border border-input text-foreground hover:bg-accent text-xs h-8 px-3" asChild>
                    <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="motion-card flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
          <div className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-transparent border border-input text-foreground hover:bg-accent hover:text-accent-foreground"
              disabled={page <= 1} 
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/admin/events?page=${page - 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>
                  Sebelumnya
                </Link>
              ) : (
                <span>Sebelumnya</span>
              )}
            </Button>
            <Button 
              className="bg-transparent border border-input text-foreground hover:bg-accent hover:text-accent-foreground"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={`/admin/events?page=${page + 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>
                  Selanjutnya
                </Link>
              ) : (
                <span>Selanjutnya</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
