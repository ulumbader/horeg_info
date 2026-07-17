"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { Menu, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { PublicSoundEventDTO } from "@/server/dal/event";
import { calculateRadiusForThreshold, NOISE_THRESHOLDS } from "@/lib/domain/noise";
import { getValidMapPosition, type MapPosition } from "@/lib/domain/coordinates";

// Map pin icon menggunakan inline SVG drop-pin style
const createMarkerIcon = (selected: boolean) => {
  const color = selected ? '#ef4444' : '#ea28f4ff';
  const size = selected ? 40 : 32;
  const shadow = selected
    ? 'filter: drop-shadow(0 2px 4px rgba(239,68,68,0.5));'
    : 'filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="${shadow} transform: translate(-50%, -100%); width: ${size}px; height: ${size}px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="1.2"/>
        <circle cx="12" cy="9" r="3" fill="white" opacity="0.9"/>
      </svg>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

interface PublicMapProps {
  events: PublicSoundEventDTO[];
  selectedSlug: string | null;
  onSelectEvent: (slug: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  isVisible: boolean;
}

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const INDONESIA_CENTER: [number, number] = [-2.5, 118.0];
const DEFAULT_ZOOM = 5;

function moveMapAfterLayout(map: L.Map, position: MapPosition, zoom: number) {
  const frame = window.requestAnimationFrame(() => {
    const container = map.getContainer();
    const bounds = container.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    map.stop();
    map.invalidateSize({ animate: false, pan: false });
    map.setView(position, zoom, { animate: true });
  });

  return () => window.cancelAnimationFrame(frame);
}

// Ukuran internal Leaflet harus diperbarui setelah panel mobile kembali terlihat.
function MapController({ selectedPosition, userPosition, isVisible }: { selectedPosition: MapPosition | null; userPosition: MapPosition | null; isVisible: boolean }) {
  const map = useMap();
  const hasFlownToUser = useRef(false);

  // Fly ke lokasi user saat pertama kali terdeteksi
  useEffect(() => {
    if (!isVisible || !userPosition || hasFlownToUser.current) return;
    hasFlownToUser.current = true;
    return moveMapAfterLayout(map, userPosition, 14);
  }, [isVisible, userPosition, map]);

  // Fokus ke event setelah container memperoleh ukuran non-zero.
  useEffect(() => {
    if (!isVisible || !selectedPosition) return;
    return moveMapAfterLayout(map, selectedPosition, 13);
  }, [isVisible, selectedPosition, map]);

  // Handle resize events (e.g., when sidebars open/close)
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };

    // ResizeObserver is better than window.resize for tracking container changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    const container = map.getContainer();
    if (container) {
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  return null;
}

export default function PublicMap({ events, selectedSlug, onSelectEvent, userLocation, isVisible }: PublicMapProps) {
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const mappableEvents = useMemo(() => events.flatMap((event) => {
    const position = getValidMapPosition(event.latitude, event.longitude);
    return position ? [{ event, position }] : [];
  }), [events]);
  const selectedPosition = mappableEvents.find(({ event }) => event.slug === selectedSlug)?.position ?? null;
  const userPosition = getValidMapPosition(userLocation?.latitude, userLocation?.longitude);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        aria-label="Peta interaktif acara Sound Horeg"
        center={INDONESIA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false} // We can add custom zoom control if needed, or leave it bottom-right
      >
        <TileLayer
          attribution={TILE_ATTRIBUTION}
          url={TILE_URL}
        />

        <MapController selectedPosition={selectedPosition} userPosition={userPosition} isVisible={isVisible} />

        {/* Render all markers */}
        {mappableEvents.map(({ event, position }) => {
          const isSelected = event.slug === selectedSlug;

          return (
            <Marker
              key={event.id}
              position={position}
              icon={createMarkerIcon(isSelected)}
              eventHandlers={{
                click: () => onSelectEvent(event.slug)
              }}
            >
              <Popup>
                <div className="text-sm font-semibold mb-1">{event.title}</div>
                <div className="text-xs text-muted-foreground">{event.city}</div>
                <div className="text-xs font-medium text-red-500 mt-1">{event.sourceDb} dB</div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Noise Zone Circles untuk SEMUA event */}
        {mappableEvents.map(({ event, position }) => {
          const isSelected = event.slug === selectedSlug;
          return (
            <NoiseZoneCircles key={`zone-${event.id}`} event={event} center={position} dimmed={!isSelected && !!selectedSlug} />
          );
        })}

        {/* User Location Marker */}
        {userPosition && (
          <Marker
            position={userPosition}
            icon={L.divIcon({
              className: 'custom-user-marker',
              html: `<div style="
                background-color: #3b82f6;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
                transform: translate(-50%, -50%);
              "></div>`,
              iconSize: [0, 0],
            })}
          >
            <Popup>
              <div className="text-sm font-semibold">Lokasi Anda</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Legend & Overlay */}
      <button
        type="button"
        className="motion-control absolute left-4 top-4 z-[410] flex h-11 w-11 items-center justify-center rounded-xl border bg-background/90 text-foreground shadow-md backdrop-blur-md md:hidden"
        aria-label={isLegendOpen ? "Tutup legenda peta" : "Buka legenda peta"}
        aria-controls="map-legend"
        aria-expanded={isLegendOpen}
        onClick={() => setIsLegendOpen((open) => !open)}
      >
        {isLegendOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <div
        id="map-legend"
        className={`${isLegendOpen ? "block" : "hidden"} pointer-events-none absolute left-4 top-16 z-[400] rounded-lg border bg-background/90 p-2 shadow-md backdrop-blur md:top-4 md:block md:bg-background/80 md:shadow-sm`}
      >
        <h3 className="text-xs font-bold mb-1">Legenda Peta</h3>
        <div className="flex items-center gap-2 text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ea28f4ff" stroke="white" strokeWidth="1.5" /><circle cx="12" cy="9" r="3" fill="white" opacity="0.9" /></svg> Acara
        </div>
        <div className="flex items-center gap-2 text-xs mt-1">
          <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444" stroke="white" strokeWidth="1.5" /><circle cx="12" cy="9" r="3" fill="white" opacity="0.9" /></svg> Dipilih
        </div>
        <div className="flex items-center gap-2 text-xs mt-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_0_2px_rgba(59,130,246,0.3)]" /> Lokasi Anda
        </div>
        <div className="mt-2 border-t pt-2 text-xs space-y-1" aria-label="Zona estimasi kebisingan">
          <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full border border-red-500 bg-red-500/20" aria-hidden="true" /> Bahaya: ≥75 dB</div>
          <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full border border-amber-500 bg-amber-500/20" aria-hidden="true" /> Waspada: ≥65 dB</div>
          <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full border border-green-500 bg-green-500/20" aria-hidden="true" /> Terdengar: ≥55 dB</div>
        </div>
      </div>

      <section className="sr-only" aria-labelledby="map-summary-heading">
        <h2 id="map-summary-heading">Ringkasan tekstual peta</h2>
        <p>{mappableEvents.length} acara ditampilkan pada peta.</p>
        <ul>
          {mappableEvents.map(({ event }) => (
            <li key={event.id}>{event.title}, {event.address}, {event.city}, estimasi sumber {event.sourceDb} dB.</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function NoiseZoneCircles({ event, center, dimmed = false }: { event: PublicSoundEventDTO; center: MapPosition; dimmed?: boolean }) {
  // Calculate radii
  const rDanger = calculateRadiusForThreshold(event.sourceDb, NOISE_THRESHOLDS.DANGER);
  const rWarning = calculateRadiusForThreshold(event.sourceDb, NOISE_THRESHOLDS.WARNING);
  const rSafe = calculateRadiusForThreshold(event.sourceDb, NOISE_THRESHOLDS.SAFE);

  // Opacity dikurangi jika bukan event yang dipilih agar tidak terlalu ramai
  const opacityMul = dimmed ? 0.3 : 1;
  const weightMul = dimmed ? 0.5 : 1;

  // Render dari terbesar ke terkecil agar lingkaran kecil di atas
  return (
    <>
      <Circle
        center={center}
        radius={rSafe}
        pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1 * opacityMul, weight: 1 * weightMul, opacity: 0.6 * opacityMul }}
      />
      <Circle
        center={center}
        radius={rWarning}
        pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15 * opacityMul, weight: 1 * weightMul, opacity: 0.7 * opacityMul }}
      />
      <Circle
        center={center}
        radius={rDanger}
        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2 * opacityMul, weight: 1 * weightMul, opacity: 0.8 * opacityMul }}
      />
    </>
  );
}
