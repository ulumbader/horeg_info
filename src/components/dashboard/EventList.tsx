"use client";

import { PublicSoundEventDTO } from "@/server/dal/event";
import { getEventTemporalStatus } from "@/lib/domain/temporal";
import { Calendar, MapPin, Volume2, AlertTriangle, Info, CheckCircle2, Locate, LocateFixed, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface EventListProps {
  events: PublicSoundEventDTO[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  currentStatus?: string;
  onStatusChange: (status?: string) => void;
  locationStatus?: string;
  onRequestLocation?: () => void;
  searchQuery?: string;
}

export function EventList({ events, selectedSlug, onSelect, currentStatus, onStatusChange, locationStatus, onRequestLocation, searchQuery }: EventListProps) {
  const ongoing = events.filter(e => getEventTemporalStatus(e.startAt, e.endAt) === "ONGOING");
  const upcoming = events.filter(e => getEventTemporalStatus(e.startAt, e.endAt) === "UPCOMING");
  const past = events.filter(e => getEventTemporalStatus(e.startAt, e.endAt) === "PAST");

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex-none sticky top-0 bg-background/95 backdrop-blur z-10">
        <h2 className="font-semibold text-lg mb-3">Daftar Acara ({events.length})</h2>
        {searchQuery && (
          <p role="status" aria-live="polite" className="mb-3 text-sm text-muted-foreground">
            {events.length > 0
              ? `${events.length} acara ditemukan untuk “${searchQuery}”.`
              : `Tidak ada acara ditemukan untuk “${searchQuery}”.`}
          </p>
        )}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <FilterChip label="Semua" active={!currentStatus} onClick={() => onStatusChange(undefined)} />
          <FilterChip label="Sdg Berjalan" count={ongoing.length} active={currentStatus === "ONGOING"} onClick={() => onStatusChange("ONGOING")} />
          <FilterChip label="Mendatang" count={upcoming.length} active={currentStatus === "UPCOMING"} onClick={() => onStatusChange("UPCOMING")} />
          <FilterChip label="Telah Lewat" count={past.length} active={currentStatus === "PAST"} onClick={() => onStatusChange("PAST")} />
        </div>
      </div>

      {onRequestLocation && (
        <div className="hidden md:flex px-4 py-3 border-b flex-none bg-muted/10 items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Lokasi Anda</span>
          <button
            onClick={onRequestLocation}
            disabled={locationStatus === 'requesting'}
            className="motion-control flex items-center gap-2 text-xs font-medium bg-background border shadow-sm px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            aria-label="Cek posisi saya"
          >
            {locationStatus === 'requesting' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : locationStatus === 'success' ? (
              <LocateFixed className="w-4 h-4 text-primary" />
            ) : (
              <Locate className="w-4 h-4 text-muted-foreground" />
            )}
            Cek Lokasi Saya
          </button>
        </div>
      )}

      <div className="motion-list p-2 space-y-2 flex-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center px-4">
            <Info className="w-8 h-8 mb-2 opacity-50" />
            <p>
              {searchQuery
                ? `Tidak ada acara yang cocok dengan pencarian “${searchQuery}”.`
                : "Tidak ada acara yang cocok dengan filter."}
            </p>
          </div>
        ) : (
          events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              selected={event.slug === selectedSlug}
              onClick={() => onSelect(event.slug)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, count, active, onClick }: { label: string, count?: number, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`motion-control px-3 py-1.5 text-xs font-medium rounded-full flex-none border ${active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent"
        }`}
    >
      {label} {count !== undefined && <span className="opacity-75 ml-1">({count})</span>}
    </button>
  );
}

function EventCard({ event, selected, onClick }: { event: PublicSoundEventDTO, selected: boolean, onClick: () => void }) {
  const status = getEventTemporalStatus(event.startAt, event.endAt);
  const statusConfig = {
    ONGOING: { color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: AlertTriangle, label: "Sdg Berjalan" },
    UPCOMING: { color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Info, label: "Mendatang" },
    PAST: { color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", icon: CheckCircle2, label: "Selesai" },
    INVALID: { color: "bg-muted text-muted-foreground", icon: Info, label: "Invalid" }
  }[status];

  const StatusIcon = statusConfig.icon;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(date));
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`motion-card motion-enter w-full text-left p-3 rounded-lg border ${selected
        ? "bg-primary/5 border-primary shadow-sm"
        : "bg-card border-border/50 hover:border-primary/30 hover:bg-muted/50"
        }`}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge variant="outline" className={`${statusConfig.color} border font-medium px-1.5 py-0`}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusConfig.label}
        </Badge>
        <div className="flex items-center text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          <Volume2 className="w-3 h-3 mr-1" />
          {event.sourceDb} dB
        </div>
      </div>

      <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-2">
        {event.title}
      </h3>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-auto">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 flex-none" />
          <span className="truncate">{formatDate(event.startAt as Date)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 flex-none" />
          <span className="truncate">{event.city}</span>
        </div>
      </div>
    </button>
  );
}
