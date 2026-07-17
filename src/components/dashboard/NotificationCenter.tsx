"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, Trash2, Volume2 } from "lucide-react";
import { formatDistance } from "@/lib/domain/formatter";

export interface StoredDangerNotification {
  eventSlug: string;
  eventTitle: string;
  distance: number;
  estimatedDb: number;
  category: "DANGER" | "WARNING" | "SAFE";
  storedAt: string;
}

interface NotificationCenterProps {
  notifications: StoredDangerNotification[];
  onClear: () => void;
  onSelect: (slug: string) => void;
}

const CATEGORY_STYLES = {
  DANGER: {
    label: "Bahaya",
    icon: "text-red-500",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  WARNING: {
    label: "Waspada",
    icon: "text-amber-500",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  SAFE: {
    label: "Terdengar",
    icon: "text-teal-500",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  },
} as const;

export function NotificationCenter({ notifications, onClear, onSelect }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="motion-control relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-glass-bg text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Notifikasi bahaya, ${notifications.length} tersimpan`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell className="h-[1.15rem] w-[1.15rem]" />
        {notifications.length > 0 && (
          <span className="motion-notification-badge absolute -right-1.5 -top-1.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold leading-4 text-center shadow-sm">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          role="dialog"
          aria-label="Notifikasi bahaya tersimpan"
          className="motion-notification-popover absolute right-0 top-12 z-[600] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-glass-border bg-card/95 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Notifikasi Bahaya</h2>
              <p className="text-[11px] text-muted-foreground">Tersimpan hanya setelah cek lokasi</p>
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="motion-control inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus semua
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <Bell className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">Belum ada notifikasi</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tekan tombol Cek Lokasi. Peringatan akan tersimpan jika lokasi Anda berada di zona dampak.
              </p>
            </div>
          ) : (
            <div className="motion-list max-h-[min(24rem,60dvh)] overflow-y-auto p-2">
              {notifications.map((notification) => {
                const style = CATEGORY_STYLES[notification.category];
                return (
                  <button
                    type="button"
                    key={notification.eventSlug}
                    onClick={() => {
                      onSelect(notification.eventSlug);
                      setIsOpen(false);
                    }}
                    className="motion-enter motion-card mb-1.5 w-full rounded-xl border border-transparent p-3 text-left hover:border-border hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${style.icon}`} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${style.badge}`}>
                            {style.label}
                          </span>
                          <time className="text-[10px] text-muted-foreground" dateTime={notification.storedAt}>
                            {new Intl.DateTimeFormat("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(notification.storedAt))}
                          </time>
                        </div>
                        <p className="truncate text-xs font-semibold">{notification.eventTitle}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Volume2 className="h-3 w-3" />
                          ~{Math.round(notification.estimatedDb)} dB
                          <span aria-hidden="true">•</span>
                          {formatDistance(notification.distance)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
