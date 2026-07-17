"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { PublicSoundEventDTO } from "@/server/dal/event";
import { formatDistance } from "@/lib/domain/formatter";
import { calculateDbAtDistance, calculateRadiusForThreshold, NOISE_THRESHOLDS } from "@/lib/domain/noise";
import { Calendar, MapPin, Volume2, Info, ExternalLink, Activity, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { EventEngagementPanel, type EventPanelMode } from "./EventEngagementPanel";

import { calculateHaversineDistance } from "@/lib/domain/distance";
import { getNoiseCategory } from "@/lib/domain/noise";

interface EventDetailProps {
  event: PublicSoundEventDTO | null;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  panelMode: EventPanelMode;
  onPanelModeChange: (mode: EventPanelMode) => void;
  isShareOpen: boolean;
  onShare: (event: PublicSoundEventDTO) => void;
}

const DETAIL_EXIT_DURATION_MS = 260;

export function EventDetail({
  event: selectedEvent,
  onClose,
  userLocation,
  panelMode,
  onPanelModeChange,
  isShareOpen,
  onShare,
}: EventDetailProps) {
  const [retainedEvent, setRetainedEvent] = useState(selectedEvent);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const event = selectedEvent ?? retainedEvent;
  const isOpen = Boolean(selectedEvent);

  if (selectedEvent && selectedEvent !== retainedEvent) {
    setRetainedEvent(selectedEvent);
  }

  useEffect(() => {
    if (selectedEvent) return;

    const unmountTimer = window.setTimeout(
      () => setRetainedEvent(null),
      DETAIL_EXIT_DURATION_MS,
    );

    return () => window.clearTimeout(unmountTimer);
  }, [selectedEvent]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsCompactViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // --- Swipe-down-to-close gesture ---
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startY: number; currentY: number; isDragging: boolean; startedOnHandle: boolean } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const SWIPE_THRESHOLD = 100;

  const handleRequestClose = useCallback(() => {
    setDragOffset(0);
    setIsDragging(false);
    onClose();
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const handle = target.closest('[data-drag-handle]');
    const scrollContainer = target.closest<HTMLElement>('[data-panel-scroll]');
    // Izinkan swipe dari handle bar, atau dari konten saat sudah di scroll paling atas
    const isAtTop = scrollContainer ? scrollContainer.scrollTop <= 0 : true;
    if (handle || (scrollContainer && isAtTop)) {
      dragState.current = {
        startY: e.touches[0].clientY,
        currentY: e.touches[0].clientY,
        isDragging: false,
        startedOnHandle: !!handle,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragState.current.startY;

    // Hanya mulai drag ke bawah
    if (!dragState.current.isDragging) {
      if (deltaY > 10) {
        dragState.current.isDragging = true;
        setIsDragging(true);
      } else if (deltaY < -10) {
        // Swipe ke atas, batalkan gesture
        dragState.current = null;
        return;
      }
    }

    if (dragState.current.isDragging) {
      // Cegah scroll saat dragging
      e.preventDefault();
      const offset = Math.max(0, deltaY);
      dragState.current.currentY = currentY;
      setDragOffset(offset);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragState.current) return;
    const wasDragging = dragState.current.isDragging;
    const finalOffset = dragState.current.currentY - dragState.current.startY;
    dragState.current = null;

    if (wasDragging && finalOffset > SWIPE_THRESHOLD) {
      handleRequestClose();
    } else {
      setDragOffset(0);
      setIsDragging(false);
    }
  }, [handleRequestClose]);

  if (!event) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(date));
  };

  const dangerRadius = calculateRadiusForThreshold(event.sourceDb, NOISE_THRESHOLDS.DANGER);
  const warningRadius = calculateRadiusForThreshold(event.sourceDb, NOISE_THRESHOLDS.WARNING);

  const db100m = calculateDbAtDistance(event.sourceDb, 100);
  const db500m = calculateDbAtDistance(event.sourceDb, 500);
  const db1km = calculateDbAtDistance(event.sourceDb, 1000);

  // Content for the detail panel
  const informationContent = (
      <div className="p-4 space-y-6">

        {/* Info Grid */}
        <div className="grid gap-4">
          <div className="flex gap-3 text-sm">
            <Calendar className="w-5 h-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Waktu Pelaksanaan</p>
              <p className="text-muted-foreground">{formatDate(event.startAt as Date)}</p>
              <p className="text-muted-foreground">s/d {formatDate(event.endAt as Date)}</p>
            </div>
          </div>

          <div className="flex gap-3 text-sm">
            <MapPin className="w-5 h-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Lokasi</p>
              <p className="text-muted-foreground">{event.venueName || "Lokasi Spesifik Belum Diketahui"}</p>
              <p className="text-muted-foreground">{event.address}, {event.city}, {event.province}</p>
            </div>
          </div>

          <div className="flex gap-3 text-sm">
            <Volume2 className="w-5 h-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Estimasi Intensitas Suara (Sumber)</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-foreground">{event.sourceDb} dB</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Noise Estimation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Estimasi Paparan Suara</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Zona Bahaya (&gt;75 dB)</p>
              <p className="text-sm font-semibold">Radius {formatDistance(dangerRadius)}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Zona Waspada (&gt;65 dB)</p>
              <p className="text-sm font-semibold">Radius {formatDistance(warningRadius)}</p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-xl space-y-3">
            <p className="text-sm font-medium">Estimasi berdasar jarak:</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pada jarak 100 m</span>
                <span className="font-semibold">{Math.round(db100m)} dB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pada jarak 500 m</span>
                <span className="font-semibold">{Math.round(db500m)} dB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pada jarak 1 km</span>
                <span className="font-semibold">{Math.round(db1km)} dB</span>
              </div>
            </div>
          </div>

          {userLocation && event.latitude != null && event.longitude != null && (
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl space-y-2 mt-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <LocateFixed className="w-4 h-4 text-primary" /> Estimasi di Lokasi Anda
              </h3>
              <p className="text-xs text-muted-foreground">Data ini tidak dikirim ke server dan hanya diproses di browser Anda demi privasi.</p>

              {(() => {
                const distance = calculateHaversineDistance(userLocation.latitude, userLocation.longitude, event.latitude, event.longitude);
                const estimatedDb = calculateDbAtDistance(event.sourceDb, distance);
                const category = getNoiseCategory(estimatedDb);

                const catInfo = {
                  DANGER: { label: "Bahaya", color: "text-red-500" },
                  WARNING: { label: "Waspada", color: "text-amber-500" },
                  SAFE: { label: "Aman", color: "text-green-500" },
                  UNKNOWN: { label: "Tidak Diketahui", color: "text-muted-foreground" }
                }[category];

                return (
                  <div className="pt-2 flex justify-between items-end border-t border-primary/10 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Jarak dari Acara</p>
                      <p className="font-semibold text-sm">{formatDistance(distance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Tingkat Suara</p>
                      <p className={`font-bold text-lg leading-none ${catInfo.color}`}>{Math.round(estimatedDb)} dB</p>
                      <p className={`text-[10px] font-medium uppercase mt-1 ${catInfo.color}`}>{catInfo.label}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex gap-2 p-3 bg-blue-500/10 text-blue-800 dark:text-blue-300 rounded-lg text-xs mt-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Estimasi ini menggunakan model propagasi lapangan bebas (free-field). Angka aktual di lapangan dapat lebih rendah akibat rintangan fisik, redaman udara, atau cuaca.
            </p>
          </div>
        </div>

        {/* Description & Source */}
        {event.summary && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold">Keterangan</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{event.summary}</p>
              {event.description && <p className="text-sm text-muted-foreground leading-relaxed mt-2">{event.description}</p>}
            </div>
          </>
        )}

        <div className="pt-4 pb-8">
          <Button asChild className="w-full bg-transparent border border-input text-foreground hover:bg-accent hover:text-accent-foreground">
            <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
              Buka Sumber {event.sourcePlatform} <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
          {event.sourceAccount && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Dipublikasikan oleh {event.sourceAccount}
            </p>
          )}
        </div>
      </div>
  );

  const detailContent = (
    <EventEngagementPanel
      key={event.slug}
      event={event}
      mode={panelMode}
      onModeChange={onPanelModeChange}
      onShare={() => onShare(event)}
      onClose={handleRequestClose}
      information={informationContent}
    />
  );

  return (
    <>
      {/* Desktop Panel */}
      <div
        data-state={isOpen ? "open" : "closed"}
        className="motion-detail-desktop hidden lg:block flex-none overflow-hidden bg-background border-l relative z-10 h-full"
      >
        <div className="w-96 h-full">{detailContent}</div>
      </div>

      <Dialog.Root
        modal={false}
        open={isOpen && isCompactViewport && !isShareOpen}
        onOpenChange={(open) => {
          if (!open && isOpen && !isShareOpen) handleRequestClose();
        }}
      >
        <Dialog.Portal>
          {/* Overlay dihilangkan agar background peta tidak blur dan tetap bisa diklik */}
          <Dialog.Content
            ref={sheetRef}
            className={`motion-detail-sheet lg:hidden fixed z-[500] bottom-0 left-0 right-0 md:left-auto md:right-0 md:top-0 md:w-96 bg-background shadow-2xl border-t md:border-t-0 md:border-l flex flex-col ${panelMode === "comments" ? "max-h-[85dvh]" : "max-h-[60dvh]"} md:max-h-[100dvh] h-full rounded-t-2xl md:rounded-none focus:outline-none`}
            style={{
              transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
              transition: isDragging ? 'none' : 'transform var(--motion-duration-base) var(--motion-ease-spring)',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Dialog.Title className="sr-only">Detail acara {event.title}</Dialog.Title>
            <Dialog.Description className="sr-only">{panelMode === "comments" ? "Komentar publik untuk acara." : "Informasi jadwal, lokasi, sumber, dan estimasi dampak suara."}</Dialog.Description>
            <div data-drag-handle className="w-full flex justify-center py-3 md:hidden flex-none cursor-grab active:cursor-grabbing" aria-hidden="true">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>
            <div className="flex-1 overflow-hidden">{detailContent}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
