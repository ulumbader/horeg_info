"use client";

import type { ReactNode } from "react";
import { MessageCircle, ThumbsUp, X } from "lucide-react";
import type { PublicSoundEventDTO } from "@/server/dal/event";
import { formatCompactCount } from "@/lib/engagement";
import { useEventEngagement } from "@/hooks/useEventEngagement";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EventCommentsPanel } from "./EventCommentsPanel";

export type EventPanelMode = "info" | "comments";

export function EventEngagementPanel({
  event,
  mode,
  onModeChange,
  onClose,
  information,
}: {
  event: PublicSoundEventDTO;
  mode: EventPanelMode;
  onModeChange: (mode: EventPanelMode) => void;
  onClose: () => void;
  information: ReactNode;
}) {
  const engagement = useEventEngagement(event.slug, event.likeCount, event.commentCount);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="z-10 shrink-0 border-b bg-background/95 p-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {event.sourcePlatform}
          </Badge>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={engagement.toggleLike}
              disabled={engagement.isLikePending}
              aria-pressed={engagement.viewerLiked}
              aria-label={`${engagement.viewerLiked ? "Batalkan like" : "Like"} acara. ${engagement.likeCount} like`}
              className={`motion-control flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-60 ${engagement.viewerLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ThumbsUp className={`h-5 w-5 ${engagement.viewerLiked ? "fill-current" : ""}`} />
              <span>{formatCompactCount(engagement.likeCount)}</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange(mode === "comments" ? "info" : "comments")}
              aria-pressed={mode === "comments"}
              aria-label={`${mode === "comments" ? "Kembali ke informasi" : "Buka komentar"}. ${engagement.commentCount} komentar`}
              className={`motion-control flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold hover:bg-accent ${mode === "comments" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <MessageCircle className={`h-5 w-5 ${mode === "comments" ? "fill-current" : ""}`} />
              <span>{formatCompactCount(engagement.commentCount)}</span>
            </button>
            <Button aria-label="Tutup panel acara" className="min-h-11 min-w-11 bg-transparent p-2 text-foreground hover:bg-accent" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <h2 className="mt-2 text-xl font-bold leading-tight">{event.title}</h2>
        {engagement.error && <p role="status" className="mt-2 text-xs text-destructive">{engagement.error}</p>}
      </header>

      <div key={mode} className="motion-enter flex min-h-0 flex-1 flex-col">
        {mode === "comments" ? (
          <EventCommentsPanel slug={event.slug} onCommentCreated={engagement.incrementCommentCount} />
        ) : (
          <div data-panel-scroll className="min-h-0 flex-1 overflow-y-auto">{information}</div>
        )}
      </div>
    </div>
  );
}
