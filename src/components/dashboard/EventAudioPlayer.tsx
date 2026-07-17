"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { GripVertical, Music2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import type { PublicSoundEventDTO } from "@/server/dal/event";
import { getAudioPreloadUrls, shouldPreloadAudio, type AudioPreloadConnection } from "@/lib/audio-preload";

export interface EventAudioPlayerHandle {
  play: (event: PublicSoundEventDTO | null) => void;
  stop: () => void;
}

type PlaybackStatus = "loading" | "playing" | "paused" | "error";
type PlayerPosition = { x: number; y: number };

const PLAYER_POSITION_STORAGE_KEY = "horeg-ews:audio-player-position:v1";
const VIEWPORT_MARGIN = 8;

type NavigatorWithConnection = Navigator & {
  connection?: AudioPreloadConnection;
};

type EventAudioPlayerProps = {
  events: readonly PublicSoundEventDTO[];
  prioritySlug?: string | null;
};

function clampPosition(position: PlayerPosition, element: HTMLElement): PlayerPosition {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.min(Math.max(position.x, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.width - VIEWPORT_MARGIN)),
    y: Math.min(Math.max(position.y, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, window.innerHeight - rect.height - VIEWPORT_MARGIN)),
  };
}

export const EventAudioPlayer = forwardRef<EventAudioPlayerHandle, EventAudioPlayerProps>(function EventAudioPlayer(
  { events, prioritySlug },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLElement>(null);
  const activeSlugRef = useRef<string | null>(null);
  const positionRef = useRef<PlayerPosition | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [activeEvent, setActiveEvent] = useState<PublicSoundEventDTO | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("paused");
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState<PlayerPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const connection = (window.navigator as NavigatorWithConnection).connection;
    if (!shouldPreloadAudio(connection)) return;

    const urls = getAudioPreloadUrls(events, prioritySlug);
    if (urls.length === 0) return;

    const controller = new AbortController();
    let cancelled = false;
    let idleTimer: number | null = null;

    const preloadSequentially = async () => {
      for (const url of urls) {
        if (cancelled) return;
        try {
          const response = await fetch(url, {
            cache: "force-cache",
            credentials: "same-origin",
            signal: controller.signal,
          });
          if (response.ok) await response.arrayBuffer();
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          // Gagal preload tidak boleh menghalangi audio lain atau pemutaran saat diklik.
        }
      }
    };

    const startPreload = () => {
      void preloadSequentially();
    };

    const requestIdleCallback = typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback.bind(window)
      : undefined;
    const cancelIdleCallback = typeof window.cancelIdleCallback === "function"
      ? window.cancelIdleCallback.bind(window)
      : undefined;

    if (requestIdleCallback) {
      const idleId = requestIdleCallback(startPreload, { timeout: 2_000 });
      return () => {
        cancelled = true;
        controller.abort();
        cancelIdleCallback?.(idleId);
      };
    }

    idleTimer = window.setTimeout(startPreload, 750);
    return () => {
      cancelled = true;
      controller.abort();
      if (idleTimer !== null) window.clearTimeout(idleTimer);
    };
  }, [events, prioritySlug]);

  const updatePosition = useCallback((next: PlayerPosition) => {
    positionRef.current = next;
    setPosition(next);
  }, []);

  const persistPosition = useCallback((next: PlayerPosition) => {
    const player = playerRef.current;
    if (!player) return;
    const rect = player.getBoundingClientRect();
    const availableX = Math.max(1, window.innerWidth - rect.width - VIEWPORT_MARGIN * 2);
    const availableY = Math.max(1, window.innerHeight - rect.height - VIEWPORT_MARGIN * 2);
    try {
      window.localStorage.setItem(PLAYER_POSITION_STORAGE_KEY, JSON.stringify({
        xRatio: Math.min(1, Math.max(0, (next.x - VIEWPORT_MARGIN) / availableX)),
        yRatio: Math.min(1, Math.max(0, (next.y - VIEWPORT_MARGIN) / availableY)),
      }));
    } catch {
      // Posisi tetap bekerja untuk sesi aktif ketika localStorage tidak tersedia.
    }
  }, []);

  useEffect(() => {
    if (!activeEvent) return;
    const frame = window.requestAnimationFrame(() => {
      const player = playerRef.current;
      if (!player) return;

      if (positionRef.current) {
        updatePosition(clampPosition(positionRef.current, player));
        return;
      }

      const rect = player.getBoundingClientRect();
      let next: PlayerPosition | null = null;
      try {
        const stored: unknown = JSON.parse(window.localStorage.getItem(PLAYER_POSITION_STORAGE_KEY) ?? "null");
        if (stored && typeof stored === "object") {
          const value = stored as Record<string, unknown>;
          if (typeof value.xRatio === "number" && typeof value.yRatio === "number") {
            const availableX = Math.max(0, window.innerWidth - rect.width - VIEWPORT_MARGIN * 2);
            const availableY = Math.max(0, window.innerHeight - rect.height - VIEWPORT_MARGIN * 2);
            next = {
              x: VIEWPORT_MARGIN + Math.min(1, Math.max(0, value.xRatio)) * availableX,
              y: VIEWPORT_MARGIN + Math.min(1, Math.max(0, value.yRatio)) * availableY,
            };
          }
        }
      } catch {
        // Gunakan posisi awal aman jika data posisi rusak.
      }

      const bottomOffset = window.innerWidth < 768 ? 92 : 16;
      updatePosition(clampPosition(next ?? {
        x: (window.innerWidth - rect.width) / 2,
        y: window.innerHeight - rect.height - bottomOffset,
      }, player));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeEvent, updatePosition]);

  useEffect(() => {
    let frame = 0;
    const handleResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const player = playerRef.current;
        const current = positionRef.current;
        if (player && current) updatePosition(clampPosition(current, player));
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [updatePosition]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    activeSlugRef.current = null;
    setActiveEvent(null);
    setStatus("paused");
  }, []);

  const play = useCallback((event: PublicSoundEventDTO | null) => {
    const audio = audioRef.current;
    if (!audio || !event?.audioStreamUrl) {
      stop();
      return;
    }

    if (activeSlugRef.current !== event.slug) {
      audio.src = event.audioStreamUrl;
      activeSlugRef.current = event.slug;
      setActiveEvent(event);
    }

    setStatus("loading");
    void audio.play().catch(() => setStatus("error"));
  }, [stop]);

  useImperativeHandle(ref, () => ({ play, stop }), [play, stop]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setStatus("loading");
      void audio.play().catch(() => setStatus("error"));
    } else {
      audio.pause();
    }
  };

  const toggleMuted = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = positionRef.current;
    if (!current || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - current.x,
      offsetY: event.clientY - current.y,
    };
    setIsDragging(true);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const player = playerRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !player) return;
    updatePosition(clampPosition({
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    }, player));
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (positionRef.current) persistPosition(positionRef.current);
  };

  const handleDragKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const player = playerRef.current;
    const current = positionRef.current;
    if (!player || !current || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 32 : 10;
    const next = clampPosition({
      x: current.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0),
      y: current.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0),
    }, player);
    updatePosition(next);
    persistPosition(next);
  };

  return (
    <>
      {/* Musik acara tidak memiliki dialog lisan yang memerlukan track caption. */}
      <audio
        ref={audioRef}
        className="hidden"
        preload="auto"
        onPlaying={() => setStatus("playing")}
        onPause={() => setStatus((current) => current === "error" ? current : "paused")}
        onEnded={() => setStatus("paused")}
        onError={() => setStatus("error")}
      />

      {activeEvent && (
        <aside
          ref={playerRef}
          aria-label="Pemutar musik acara"
          className={`motion-audio-player fixed z-[550] flex min-h-14 w-[calc(100dvw-2rem)] max-w-[19rem] items-center gap-1.5 overflow-hidden rounded-2xl border border-glass-border bg-card/95 px-1.5 py-1.5 shadow-2xl backdrop-blur-xl sm:w-[calc(100vw-1rem)] sm:max-w-xl sm:gap-3 sm:px-3 sm:py-2 ${isDragging ? "motion-audio-player-dragging" : ""}`}
          style={{
            left: position?.x ?? 0,
            top: position?.y ?? 0,
            visibility: position ? "visible" : "hidden",
          }}
        >
          <div
            role="button"
            tabIndex={0}
            aria-label="Geser posisi pemutar musik. Gunakan tombol panah saat fokus."
            className="flex h-11 w-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-xl text-muted-foreground hover:bg-muted active:cursor-grabbing"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            onKeyDown={handleDragKeyDown}
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
            <Music2 className={`h-4 w-4 ${status === "playing" ? "motion-music-playing" : ""}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{activeEvent.audioTitle || "Musik Acara"}</p>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">{activeEvent.title}</p>
            {status === "error" && <p role="status" className="text-[10px] text-destructive">Audio gagal dimuat. Periksa URL musik.</p>}
          </div>
          <button type="button" onClick={toggleMuted} className="motion-control flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-muted sm:h-10 sm:w-10" aria-label={isMuted ? "Aktifkan suara" : "Bisukan musik"}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button type="button" onClick={togglePlayback} className="motion-control flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm sm:h-10 sm:w-10" aria-label={status === "playing" ? "Jeda musik" : "Putar musik"}>
            {status === "playing" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
          <button type="button" onClick={stop} className="motion-control flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:h-10 sm:w-10" aria-label="Tutup pemutar musik">
            <X className="h-4 w-4" />
          </button>
        </aside>
      )}
    </>
  );
});
