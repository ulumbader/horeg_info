"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUp, LoaderCircle, MessageCircle } from "lucide-react";
import type { PublicCommentDTO } from "@/lib/engagement";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type CommentPage = { comments: PublicCommentDTO[]; nextCursor: string | null };

export function EventCommentsPanel({ slug, onCommentCreated }: { slug: string; onCommentCreated: () => void }) {
  const [comments, setComments] = useState<PublicCommentDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const loadComments = useCallback(async (cursor?: string) => {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const response = await fetch(`/api/events/${encodeURIComponent(slug)}/comments${query}`, {
      credentials: "same-origin",
    });
    const result = (await response.json()) as CommentPage & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Komentar tidak dapat dimuat");
    return result;
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/events/${encodeURIComponent(slug)}/comments`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as CommentPage & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Komentar tidak dapat dimuat");
        return result;
      })
      .then((page) => {
        setComments(page.comments);
        setNextCursor(page.nextCursor);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Komentar tidak dapat dimuat");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await loadComments(nextCursor);
      setComments((current) => [...current, ...page.comments]);
      setNextCursor(page.nextCursor);
      setError(null);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Komentar tidak dapat dimuat");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    const normalizedBody = body.trim();
    if (!normalizedBody) {
      setError("Komentar tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch(`/api/events/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          body: normalizedBody,
          clientRequestId: crypto.randomUUID(),
          website: String(form.get("website") ?? ""),
        }),
      });
      const result = (await response.json()) as { comment?: PublicCommentDTO; error?: string };
      if (!response.ok || !result.comment) throw new Error(result.error ?? "Komentar tidak dapat dikirim");
      setComments((current) => [result.comment as PublicCommentDTO, ...current]);
      setBody("");
      onCommentCreated();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Komentar tidak dapat dikirim");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form onSubmit={handleSubmit} className="border-b p-4">
        <div className="flex items-center gap-2">
          <label htmlFor={`comment-${slug}`} className="sr-only">Tambah komentar</label>
          <input
            type="text"
            id={`comment-${slug}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={500}
            className="flex-1 h-11 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Tambah komentar..."
            disabled={isSubmitting}
          />
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <Button type="submit" disabled={isSubmitting || !body.trim()} className="h-11 w-11 shrink-0 rounded-full p-0 flex items-center justify-center">
            {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
            <span className="sr-only">Kirim komentar</span>
          </Button>
        </div>
        {error && <p role="alert" className="mt-2 px-2 text-sm text-destructive">{error}</p>}
      </form>

      <div data-panel-scroll className="min-h-0 flex-1 overflow-y-auto p-4" aria-live="polite">
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Memuat komentar...
          </div>
        ) : comments.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center text-muted-foreground">
            <MessageCircle className="mb-3 h-8 w-8" />
            <p className="font-medium text-foreground">Belum ada komentar</p>
            <p className="mt-1 text-sm">Jadilah yang pertama memberi komentar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <article key={comment.id} className="rounded-xl border bg-card/70 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  {comment.authorType === "ADMIN" ? (
                    <Badge className="bg-primary text-primary-foreground">ADMIN</Badge>
                  ) : (
                    <span className="text-sm font-semibold">Anonim</span>
                  )}
                  <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(comment.createdAt))}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{comment.body}</p>
                {comment.editedAt && <p className="mt-2 text-xs text-muted-foreground">Diedit</p>}
              </article>
            ))}
            {nextCursor && (
              <Button type="button" onClick={handleLoadMore} disabled={isLoadingMore} className="min-h-11 w-full bg-transparent text-foreground border border-input hover:bg-accent">
                {isLoadingMore ? "Memuat..." : "Muat komentar lainnya"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
