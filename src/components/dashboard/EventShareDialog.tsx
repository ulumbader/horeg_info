"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Camera,
  Check,
  Copy,
  Link,
  MessageCircleMore,
  Send,
  UsersRound,
  X,
} from "lucide-react";
import type { PublicSoundEventDTO } from "@/server/dal/event";
import {
  buildEventShareTargets,
  buildEventShareText,
  buildEventShareUrl,
} from "@/lib/event-share";

interface EventShareDialogProps {
  event: PublicSoundEventDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShareOptionProps {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href?: string;
  onClick?: () => void;
  onOpenChange: (open: boolean) => void;
}

async function copyShareUrl(shareUrl: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return;
    } catch {
      // Browser tertentu tetap menolak Clipboard API meski berjalan di HTTPS.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = shareUrl;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "-9999px auto auto -9999px";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Browser tidak mengizinkan penyalinan tautan.");
  }
}

function ShareOption({ label, icon: Icon, href, onClick, onOpenChange }: ShareOptionProps) {
  const className = "motion-control group flex min-w-0 flex-col items-center gap-2 rounded-2xl px-0.5 py-2 text-center text-[10px] font-medium text-muted-foreground hover:bg-accent/10 hover:text-foreground sm:px-1 sm:text-xs";
  const content = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-glass-border bg-muted/80 text-foreground shadow-sm transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary sm:h-12 sm:w-12">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="whitespace-nowrap leading-tight">{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Bagikan ke ${label}`}
        className={className}
        onClick={() => onOpenChange(false)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Bagikan ke ${label}`}
      className={className}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

function EventShareDialogBody({
  event,
  onOpenChange,
}: {
  event: PublicSoundEventDTO;
  onOpenChange: (open: boolean) => void;
}) {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const shareUrl = buildEventShareUrl(window.location.origin, event.slug);
  const shareText = buildEventShareText(event.title);
  const targets = buildEventShareTargets(shareUrl, shareText);

  const handleCopy = async (message = "Tautan acara berhasil disalin.") => {
    try {
      await copyShareUrl(shareUrl);
      setFeedback({ type: "success", message });
    } catch {
      setFeedback({
        type: "error",
        message: "Tautan belum dapat disalin. Silakan pilih dan salin URL secara manual.",
      });
    }
  };

  const handleInstagramShare = async () => {
    const shareData: ShareData = {
      title: event.title,
      text: shareText,
      url: shareUrl,
    };

    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(shareData))) {
      try {
        await navigator.share(shareData);
        onOpenChange(false);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await handleCopy("Tautan disalin. Tempelkan tautan tersebut di Instagram.");
  };

  return (
    <>
      <div className="pr-12">
        <Dialog.Title className="text-xl font-bold tracking-tight text-foreground">Share to</Dialog.Title>
        <Dialog.Description className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          Bagikan rincian {event.title}
        </Dialog.Description>
      </div>

      <Dialog.Close asChild>
        <button
          type="button"
          aria-label="Tutup dialog bagikan"
          className="motion-control absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/10 hover:text-foreground"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </Dialog.Close>

      <div className="mt-6 grid grid-cols-5 gap-1 sm:gap-2" aria-label="Pilihan aplikasi berbagi">
        <ShareOption label="WhatsApp" icon={MessageCircleMore} href={targets.whatsapp} onOpenChange={onOpenChange} />
        <ShareOption label="Facebook" icon={UsersRound} href={targets.facebook} onOpenChange={onOpenChange} />
        <ShareOption label="Instagram" icon={Camera} onClick={handleInstagramShare} onOpenChange={onOpenChange} />
        <ShareOption label="X" icon={X} href={targets.x} onOpenChange={onOpenChange} />
        <ShareOption label="Telegram" icon={Send} href={targets.telegram} onOpenChange={onOpenChange} />
      </div>

      <div className="mt-6 border-t pt-5">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Link className="h-4 w-4 text-primary" aria-hidden="true" />
          Copy URL
        </p>
        <div className="flex min-h-12 items-center gap-2 rounded-xl border bg-background/80 p-1.5 pl-3 shadow-inner">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{shareUrl}</span>
          <button
            type="button"
            aria-label="Salin URL acara"
            onClick={() => void handleCopy()}
            className="motion-control flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            {feedback?.type === "success" ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{feedback?.type === "success" ? "Disalin" : "Salin"}</span>
          </button>
        </div>
        {feedback && (
          <p
            role={feedback.type === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`mt-2 text-xs ${feedback.type === "error" ? "text-destructive" : "text-primary"}`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </>
  );
}

export function EventShareDialog({ event, open, onOpenChange }: EventShareDialogProps) {
  if (!event) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="motion-share-overlay fixed inset-0 z-[900] bg-background/55" />
        <Dialog.Content className="motion-share-dialog fixed left-1/2 top-1/2 z-[910] w-[calc(100%-2rem)] max-w-md rounded-[1.75rem] border border-glass-border p-5 text-card-foreground shadow-2xl backdrop-blur-2xl focus:outline-none sm:p-6">
          <EventShareDialogBody event={event} onOpenChange={onOpenChange} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
