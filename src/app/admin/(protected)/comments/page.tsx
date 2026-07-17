import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { CommentManager } from "@/components/admin/CommentManager";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requireAdmin } from "@/server/auth";
import { getAdminCommentOptions, getAdminComments } from "@/server/dal/engagement";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const requestedPage = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 100) : undefined;
  const author = params.author === "ADMIN" || params.author === "ANONYMOUS" ? params.author : undefined;
  const [events, result] = await Promise.all([
    getAdminCommentOptions(),
    getAdminComments({ page, search, authorType: author }),
  ]);

  const queryForPage = (targetPage: number) => {
    const query = new URLSearchParams();
    query.set("page", String(targetPage));
    if (search) query.set("search", search);
    if (author) query.set("author", author);
    return `/admin/comments?${query.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Komentar Acara</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Tambah komentar berlabel ADMIN, edit komentar ADMIN, atau hapus komentar yang melanggar.</p>
      </div>

      <form method="GET" className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="search" defaultValue={search} placeholder="Cari isi komentar atau acara..." className="min-h-11 bg-background pl-9" />
        </div>
        <select name="author" defaultValue={author ?? "ALL"} className="min-h-11 rounded-md border border-input bg-background px-3 text-sm">
          <option value="ALL">Semua penulis</option>
          <option value="ADMIN">ADMIN</option>
          <option value="ANONYMOUS">Anonim</option>
        </select>
        <Button type="submit" className="min-h-11">Filter</Button>
      </form>

      <p className="text-sm text-muted-foreground">{result.total} komentar aktif</p>
      <CommentManager events={events} comments={result.items} />

      {result.totalPages > 1 && (
        <nav aria-label="Paginasi komentar" className="flex items-center justify-between rounded-xl border bg-card p-4">
          <span className="text-sm text-muted-foreground">Halaman {page} dari {result.totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Button asChild className="bg-transparent text-foreground border border-input hover:bg-accent"><Link href={queryForPage(page - 1)}>Sebelumnya</Link></Button>}
            {page < result.totalPages && <Button asChild className="bg-transparent text-foreground border border-input hover:bg-accent"><Link href={queryForPage(page + 1)}>Selanjutnya</Link></Button>}
          </div>
        </nav>
      )}
    </div>
  );
}
