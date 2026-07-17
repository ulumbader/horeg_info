"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, MessageCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { createAdminComment, deleteComment, updateAdminComment } from "@/server/actions/comment";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type EventOption = { id: string; title: string; publicationStatus: string };
type AdminComment = {
  id: string;
  body: string;
  authorType: "ANONYMOUS" | "ADMIN";
  createdAt: string;
  editedAt: string | null;
  adminUserId: string | null;
  event: { id: string; slug: string; title: string; publicationStatus: string };
};

export function CommentManager({ events, comments }: { events: EventOption[]; comments: AdminComment[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refreshAfter = (operation: () => Promise<{ success: boolean; error?: string }>, onSuccess?: () => void) => {
    setError(null);
    startTransition(async () => {
      const result = await operation();
      if (!result.success) {
        setError(result.error ?? "Operasi gagal");
        return;
      }
      onSuccess?.();
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Tambah komentar ADMIN</h2>
            <p className="text-xs text-muted-foreground">Komentar akan mendapat label ADMIN pada halaman publik.</p>
          </div>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tambahkan acara terlebih dahulu.</p>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              refreshAfter(() => createAdminComment({ eventId, body }), () => setBody(""));
            }}
          >
            <div className="grid gap-1.5">
              <label htmlFor="admin-comment-event" className="text-sm font-medium">Acara</label>
              <select id="admin-comment-event" value={eventId} onChange={(event) => setEventId(event.target.value)} className="min-h-11 rounded-md border border-input bg-background px-3 text-sm">
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.title} ({event.publicationStatus})</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="admin-comment-body" className="text-sm font-medium">Komentar</label>
              <textarea id="admin-comment-body" aria-describedby="admin-comment-counter" value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} rows={3} className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <span id="admin-comment-counter" className="text-right text-xs text-muted-foreground">{body.length}/500</span>
            </div>
            <Button type="submit" disabled={isPending || !body.trim()} className="min-h-11 justify-self-start gap-2">
              <MessageCircle className="h-4 w-4" /> Tambah komentar
            </Button>
          </form>
        )}
      </section>

      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <section className="space-y-3">
        {comments.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">Tidak ada komentar yang sesuai filter.</div>
        ) : comments.map((comment) => (
          <article key={comment.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {comment.authorType === "ADMIN" ? <Badge>ADMIN</Badge> : <Badge variant="outline">Anonim</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(comment.createdAt))}
                  </span>
                  {comment.editedAt && <span className="text-xs text-muted-foreground">· diedit</span>}
                </div>
                <p className="text-sm font-semibold">{comment.event.title}</p>
                {editingId === comment.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea value={editingBody} onChange={(event) => setEditingBody(event.target.value)} maxLength={500} rows={3} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    <div className="flex gap-2">
                      <Button type="button" disabled={isPending || !editingBody.trim()} onClick={() => refreshAfter(() => updateAdminComment({ id: comment.id, body: editingBody }), () => setEditingId(null))}>Simpan</Button>
                      <Button type="button" onClick={() => setEditingId(null)} className="gap-1 bg-transparent text-foreground border border-input hover:bg-accent"><X className="h-4 w-4" /> Batal</Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{comment.body}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {comment.event.publicationStatus === "PUBLISHED" && (
                  <Button asChild className="min-h-11 min-w-11 bg-transparent p-2 text-foreground hover:bg-accent">
                    <a href={`/?event=${encodeURIComponent(comment.event.slug)}&panel=comments`} target="_blank" rel="noopener noreferrer" aria-label="Buka komentar pada halaman publik"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                )}
                {comment.authorType === "ADMIN" && editingId !== comment.id && (
                  <Button type="button" className="min-h-11 min-w-11 bg-transparent p-2 text-foreground hover:bg-accent" aria-label="Edit komentar admin" onClick={() => { setEditingId(comment.id); setEditingBody(comment.body); }}><Pencil className="h-4 w-4" /></Button>
                )}
                <Button
                  type="button"
                  disabled={isPending}
                  aria-label="Hapus komentar"
                  className="min-h-11 min-w-11 bg-transparent p-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    if (window.confirm("Hapus komentar ini dari halaman publik?")) refreshAfter(() => deleteComment(comment.id));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
