"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PublicSoundEventDTO } from "@/server/dal/event";
import { getEventTemporalStatus, sortEventsTemporally } from "@/lib/domain/temporal";
import { parseEventFilters, serializeEventFilters } from "@/lib/domain/filter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshCw, Map as MapIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EventList } from "./EventList";
import { DynamicPublicMap } from "@/components/map/DynamicPublicMap";
import { EventDetail } from "./EventDetail";
import type { EventPanelMode } from "./EventEngagementPanel";
import { NotificationCenter, StoredDangerNotification } from "./NotificationCenter";
import { EventAudioPlayer, EventAudioPlayerHandle } from "./EventAudioPlayer";

import { useGeolocation } from "@/hooks/useGeolocation";
import { useAnalytics } from "@/hooks/useAnalytics";
import { calculateHaversineDistance } from "@/lib/domain/distance";
import { calculateDbAtDistance, getNoiseCategory, NOISE_THRESHOLDS } from "@/lib/domain/noise";
import { formatDistance } from "@/lib/domain/formatter";
import { Locate, LocateFixed, MapPinOff, XCircle, List, AlertTriangle, X, ChevronRight, Volume2 } from "lucide-react";

const DANGER_NOTIFICATIONS_STORAGE_KEY = "horeg-ews:danger-notifications:v1";
const MAX_STORED_NOTIFICATIONS = 20;

function readStoredNotifications(): StoredDangerNotification[] {
  try {
    const stored = window.localStorage.getItem(DANGER_NOTIFICATIONS_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is StoredDangerNotification => {
      if (!item || typeof item !== "object") return false;
      const notification = item as Record<string, unknown>;
      return typeof notification.eventSlug === "string"
        && typeof notification.eventTitle === "string"
        && typeof notification.distance === "number"
        && Number.isFinite(notification.distance)
        && typeof notification.estimatedDb === "number"
        && Number.isFinite(notification.estimatedDb)
        && (notification.category === "DANGER" || notification.category === "WARNING" || notification.category === "SAFE")
        && typeof notification.storedAt === "string";
    }).slice(0, MAX_STORED_NOTIFICATIONS);
  } catch {
    return [];
  }
}

export function DashboardClient({ initialEvents }: { initialEvents: PublicSoundEventDTO[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: geoStatus, coordinates: userLoc, errorMessage: geoError, requestPosition } = useGeolocation();

  // Track page views and online presence
  useAnalytics("/");

  // Parse filters from URL
  const filters = useMemo(() => parseEventFilters(searchParams), [searchParams]);
  const selectedSlug = searchParams.get("event") || null;
  const selectedPanelMode: EventPanelMode = searchParams.get("panel") === "comments" ? "comments" : "info";

  // Local state for immediate typing
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storedNotifications, setStoredNotifications] = useState<StoredDangerNotification[]>([]);
  const storedNotificationsRef = useRef<StoredDangerNotification[]>([]);
  const pendingLocationCheck = useRef(false);
  const audioPlayerRef = useRef<EventAudioPlayerHandle>(null);

  const commitStoredNotifications = useCallback((notifications: StoredDangerNotification[]) => {
    storedNotificationsRef.current = notifications;
    setStoredNotifications(notifications);
    try {
      window.localStorage.setItem(DANGER_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // State sesi tetap berfungsi ketika penyimpanan browser diblokir atau penuh.
    }
  }, []);

  useEffect(() => {
    const loadFrame = window.requestAnimationFrame(() => {
      const notifications = readStoredNotifications();
      storedNotificationsRef.current = notifications;
      setStoredNotifications(notifications);
    });
    return () => window.cancelAnimationFrame(loadFrame);
  }, []);

  // Mobile view toggle: 'map' or 'list'
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  // Sync back to URL when filters change
  const updateFilters = useCallback(
    (newFilters: Partial<typeof filters & { event?: string | null; panel?: EventPanelMode | null }>) => {
      const merged = { ...filters, ...newFilters };
      const params = serializeEventFilters(merged);

      const newSlug = newFilters.event !== undefined ? newFilters.event : selectedSlug;
      if (newSlug) params.set("event", newSlug);
      const newPanel = newFilters.panel !== undefined ? newFilters.panel : selectedPanelMode;
      if (newSlug && newPanel === "comments") params.set("panel", "comments");

      const query = params.toString();
      window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    },
    [filters, selectedSlug, selectedPanelMode, pathname]
  );

  const clearFilters = useCallback(() => {
    setSearchValue("");
    window.history.replaceState(null, "", pathname);
  }, [pathname]);

  const selectEvent = useCallback(
    (slug: string | null) => {
      updateFilters({ event: slug, panel: null });
    },
    [updateFilters]
  );

  const selectEventWithAudio = useCallback((slug: string) => {
    selectEvent(slug);
    const event = initialEvents.find((candidate) => candidate.slug === slug) ?? null;
    audioPlayerRef.current?.play(event);
  }, [initialEvents, selectEvent]);

  // Saat memilih event dari daftar di mobile, otomatis ke peta
  const selectEventFromList = useCallback(
    (slug: string) => {
      selectEventWithAudio(slug);
      setMobileView('map');
    },
    [selectEventWithAudio]
  );

  const submitMobileSearch = useCallback((query: string) => {
    setSearchValue(query);
    updateFilters({ search: query });
    setMobileView('list');
  }, [updateFilters]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh(); // Does not reset URL state!
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = initialEvents;

    if (filters.status) {
      result = result.filter(e => getEventTemporalStatus(e.startAt, e.endAt) === filters.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q)
      );
    }

    return sortEventsTemporally(result);
  }, [initialEvents, filters]);

  // Validasi event yang difilter keluar agar tidak terpilih secara tersembunyi
  useEffect(() => {
    if (selectedSlug) {
      const exists = filteredEvents.find(e => e.slug === selectedSlug);
      if (!exists) {
        updateFilters({ event: null });
      }
    }
  }, [filteredEvents, selectedSlug, updateFilters]);

  // Ref guard: auto-select hanya sekali saat geolocation pertama kali berhasil
  const geoAutoSelectDone = useRef(false);

  // Jika geolocation sukses, dan belum pernah auto-select, cari yang terdekat
  useEffect(() => {
    if (geoAutoSelectDone.current) return;
    if (geoStatus === "success" && userLoc && !selectedSlug && filteredEvents.length > 0) {
      let nearestDist = Infinity;
      let nearestSlug: string | null = null;

      for (const event of filteredEvents) {
        if (event.latitude != null && event.longitude != null) {
          const dist = calculateHaversineDistance(userLoc.latitude, userLoc.longitude, event.latitude, event.longitude);
          if (dist >= 0 && dist < nearestDist) {
            nearestDist = dist;
            nearestSlug = event.slug;
          }
        }
      }

      if (nearestSlug) {
        geoAutoSelectDone.current = true;
        updateFilters({ event: nearestSlug });
      }
    }
  }, [geoStatus, userLoc, selectedSlug, filteredEvents, updateFilters]);

  const selectedEvent = useMemo(
    () => initialEvents.find(e => e.slug === selectedSlug) || null,
    [initialEvents, selectedSlug]
  );

  const hasActiveFilters = Object.keys(filters).length > 0;

  // === PROXIMITY WARNING SYSTEM ===
  // Cek apakah lokasi pengguna berada di dalam zona dampak acara yang sedang berlangsung atau mendatang
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  interface ProximityWarning {
    event: PublicSoundEventDTO;
    distance: number;
    estimatedDb: number;
    category: "DANGER" | "WARNING" | "SAFE";
  }

  const proximityWarnings = useMemo<ProximityWarning[]>(() => {
    if (!userLoc || geoStatus !== 'success') return [];

    const warnings: ProximityWarning[] = [];

    for (const event of initialEvents) {
      if (event.latitude == null || event.longitude == null) continue;
      if (!Number.isFinite(event.latitude) || !Number.isFinite(event.longitude)) continue;

      // Hanya acara yang sedang berlangsung atau mendatang
      const temporal = getEventTemporalStatus(event.startAt, event.endAt);
      if (temporal !== 'ONGOING' && temporal !== 'UPCOMING') continue;

      const distance = calculateHaversineDistance(
        userLoc.latitude, userLoc.longitude,
        event.latitude, event.longitude
      );

      const estimatedDb = calculateDbAtDistance(event.sourceDb, distance);
      const category = getNoiseCategory(estimatedDb);

      // Hanya tampilkan jika di dalam zona model (≥55 dB)
      if (category === 'DANGER' || category === 'WARNING' || (category === 'SAFE' && estimatedDb >= NOISE_THRESHOLDS.SAFE)) {
        warnings.push({ event, distance, estimatedDb, category });
      }
    }

    // Urutkan berdasarkan dB tertinggi (paling bahaya dulu)
    warnings.sort((a, b) => b.estimatedDb - a.estimatedDb);
    return warnings;
  }, [initialEvents, userLoc, geoStatus]);

  const handleLocationCheck = useCallback(() => {
    pendingLocationCheck.current = true;
    requestPosition();
  }, [requestPosition]);

  useEffect(() => {
    if (!pendingLocationCheck.current || geoStatus === "idle" || geoStatus === "requesting") return;
    pendingLocationCheck.current = false;
    if (geoStatus !== "success" || proximityWarnings.length === 0) return;

    const storedAt = new Date().toISOString();
    const latest = proximityWarnings.map<StoredDangerNotification>((warning) => ({
      eventSlug: warning.event.slug,
      eventTitle: warning.event.title,
      distance: warning.distance,
      estimatedDb: warning.estimatedDb,
      category: warning.category,
      storedAt,
    }));
    const latestSlugs = new Set(latest.map((notification) => notification.eventSlug));
    const next = [
      ...latest,
      ...storedNotificationsRef.current.filter((notification) => !latestSlugs.has(notification.eventSlug)),
    ].slice(0, MAX_STORED_NOTIFICATIONS);
    commitStoredNotifications(next);
  }, [commitStoredNotifications, geoStatus, proximityWarnings]);

  const activeWarnings = proximityWarnings.filter(w => !dismissedAlerts.has(w.event.slug));

  const handleDismissAlert = useCallback((slug: string) => {
    setDismissedAlerts(prev => new Set(prev).add(slug));
  }, []);

  const handleAlertClick = useCallback((slug: string) => {
    selectEventWithAudio(slug);
    setMobileView('map');
  }, [selectEventWithAudio]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* HEADER */}
      <header className="flex-none h-14 md:h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="SOUND HOREG.INFO" width={36} height={36} className="w-8 h-8 md:w-9 md:h-9 shrink-0" priority />
          <div>
            <h1 className="font-bold text-base leading-tight">SOUND HOREG.INFO</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Peta Peringatan Dini</p>
          </div>
        </div>

        <div className="flex flex-1 max-w-md mx-4 hidden md:flex relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 pr-10 h-9 w-full bg-muted/50"
            placeholder="Cari acara atau lokasi..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') updateFilters({ search: searchValue });
            }}
            onBlur={() => updateFilters({ search: searchValue })}
          />
          {hasActiveFilters && (
            <button type="button" aria-label="Hapus semua filter" onClick={clearFilters} className="motion-control absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationCenter
            notifications={storedNotifications}
            onClear={() => commitStoredNotifications([])}
            onSelect={handleAlertClick}
          />
          <Button
            className={`w-9 h-9 p-0 bg-transparent border border-input text-foreground hover:bg-accent hover:text-accent-foreground flex items-center justify-center ${isRefreshing ? "opacity-50" : ""}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {/* MOBILE SEARCH BAR */}
      <div className="md:hidden p-2 border-b flex-none bg-muted/30">
        <form
          className="flex items-center gap-2"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const query = new FormData(event.currentTarget).get("search");
            submitMobileSearch(typeof query === "string" ? query : "");
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 pr-11 h-11 w-full bg-background"
              placeholder="Cari acara..."
              aria-label="Cari acara atau lokasi"
              name="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {hasActiveFilters && (
              <button type="button" aria-label="Hapus semua filter" onClick={clearFilters} className="motion-control absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="h-11 shrink-0 gap-2 px-3" aria-label="Cari acara">
            <Search className="h-4 w-4" />
            <span>Cari</span>
          </Button>
        </form>
      </div>

      <EventAudioPlayer ref={audioPlayerRef} events={initialEvents} prioritySlug={selectedSlug} />

      {/* BODY */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* PROXIMITY WARNINGS FLOATING */}
        {activeWarnings.length > 0 && (
          <div className="absolute top-2 left-2 right-2 md:left-auto md:right-4 md:w-96 z-[200] flex flex-col gap-2 pointer-events-none">
            {activeWarnings.slice(0, 2).map(warning => (
              <div key={warning.event.slug} className="pointer-events-auto rounded-xl overflow-hidden border shadow-lg backdrop-blur-md">
                <ProximityAlertBanner
                  warning={warning}
                  onDismiss={() => handleDismissAlert(warning.event.slug)}
                  onClick={() => handleAlertClick(warning.event.slug)}
                />
              </div>
            ))}
          </div>
        )}

        {/* SIDEBAR LIST — desktop: selalu tampil. Mobile: tampil saat mobileView === 'list' */}
        <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex flex-1 md:w-80 lg:w-96 md:flex-none border-r bg-background/50 overflow-y-auto flex-col z-10`}>
          <EventList
            events={filteredEvents}
            selectedSlug={selectedSlug}
            onSelect={selectEventFromList}
            currentStatus={filters.status}
            onStatusChange={(status) => updateFilters({ status })}
            locationStatus={geoStatus}
            onRequestLocation={handleLocationCheck}
            searchQuery={filters.search}
          />
        </div>

        {/* PETA — desktop: selalu tampil. Mobile: tampil saat mobileView === 'map' */}
        <div className={`${mobileView === 'map' ? 'flex' : 'hidden'} md:flex flex-1 md:flex-1 relative bg-muted/20 z-0 flex-col`}>
          <div className="flex-1 relative">
            <DynamicPublicMap
              events={filteredEvents}
              selectedSlug={selectedSlug}
              onSelectEvent={(slug) => {
                if (slug) selectEventWithAudio(slug);
                else selectEvent(null);
              }}
              userLocation={userLoc}
              isVisible={mobileView === 'map'}
            />
            <GeoControl
              status={geoStatus}
              requestPosition={handleLocationCheck}
              errorMessage={geoError}
              className="absolute bottom-4 right-4 z-[400]"
            />
          </div>
        </div>

        {/* DETAIL PANEL */}
        <EventDetail
          event={selectedEvent}
          onClose={() => updateFilters({ event: null, panel: null })}
          userLocation={userLoc}
          panelMode={selectedPanelMode}
          onPanelModeChange={(panel) => updateFilters({ panel })}
        />

        {/* MOBILE BOTTOM TAB — toggle Peta/Daftar */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[500]">
          <div className="flex bg-background/90 backdrop-blur-md border shadow-lg rounded-full p-1 gap-1">
            <button
              onClick={() => setMobileView('map')}
              className={`motion-control flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${mobileView === 'map'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              aria-label="Tampilan peta"
              aria-pressed={mobileView === 'map'}
            >
              <MapIcon className="w-4 h-4" />
              <span>Peta</span>
            </button>
            <button
              onClick={() => setMobileView('list')}
              className={`motion-control flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${mobileView === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              aria-label="Tampilan daftar"
              aria-pressed={mobileView === 'list'}
            >
              <List className="w-4 h-4" />
              <span>Daftar ({filteredEvents.length})</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

function GeoControl({ status, requestPosition, errorMessage, className }: { status: string, requestPosition: () => void, errorMessage: string | null, className?: string }) {
  return (
    <div className={`flex flex-col items-end gap-2 ${className}`}>
      {errorMessage && (
        <div role="status" aria-live="polite" className="motion-notice bg-destructive text-destructive-foreground text-xs p-2 rounded max-w-[200px] shadow-sm flex gap-2">
          <MapPinOff className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      <Button
        onClick={requestPosition}
        disabled={status === 'requesting'}
        className="bg-background text-foreground border shadow-md hover:bg-accent hover:text-accent-foreground h-auto p-2"
        aria-label="Cek posisi saya"
      >
        {status === 'requesting' ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : status === 'success' ? (
          <LocateFixed className="w-5 h-5 text-primary" />
        ) : (
          <Locate className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="sr-only">Cek posisi saya</span>
      </Button>
    </div>
  );
}

interface ProximityAlertBannerProps {
  warning: {
    event: PublicSoundEventDTO;
    distance: number;
    estimatedDb: number;
    category: "DANGER" | "WARNING" | "SAFE";
  };
  onDismiss: () => void;
  onClick: () => void;
}

function ProximityAlertBanner({ warning, onDismiss, onClick }: ProximityAlertBannerProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const { event, distance, estimatedDb, category } = warning;
  const temporal = getEventTemporalStatus(event.startAt, event.endAt);

  const config = {
    DANGER: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: 'text-red-500',
      badge: 'bg-red-500 text-white',
      label: '⚠ BAHAYA',
      message: 'Anda berada di zona bahaya suara!',
    },
    WARNING: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: 'text-amber-500',
      badge: 'bg-amber-500 text-white',
      label: '⚡ WASPADA',
      message: 'Anda berada di zona waspada suara.',
    },
    SAFE: {
      bg: 'bg-teal-500/10 border-teal-500/30',
      icon: 'text-teal-500',
      badge: 'bg-teal-500 text-white',
      label: 'ℹ TERDENGAR',
      message: 'Suara acara dapat terdengar di lokasi Anda.',
    },
  }[category];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`${config.bg} px-3 py-2.5 flex items-center gap-3 ${isLeaving ? "motion-alert-exit" : "motion-alert-enter"}`}
    >
      {/* Icon */}
      <div className={`shrink-0 ${config.icon}`}>
        <AlertTriangle className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`${config.badge} text-[10px] font-bold px-1.5 py-0.5 rounded`}>
            {config.label}
          </span>
          {temporal === 'ONGOING' && (
            <span className="text-[10px] font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">BERLANGSUNG</span>
          )}
          {temporal === 'UPCOMING' && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">MENDATANG</span>
          )}
        </div>
        <p className="text-xs font-semibold truncate">{event.title}</p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-0.5">
            <Volume2 className="w-3 h-3" />~{Math.round(estimatedDb)} dB
          </span>
          <span>•</span>
          <span>{formatDistance(distance)}</span>
        </p>
      </div>

      {/* Action buttons */}
      <button
        onClick={onClick}
        className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        aria-label={`Lihat acara ${event.title} di peta`}
      >
        Lihat
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => {
          setIsLeaving(true);
          window.setTimeout(onDismiss, 220);
        }}
        className="motion-control shrink-0 p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50"
        aria-label={`Tutup peringatan ${event.title}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
