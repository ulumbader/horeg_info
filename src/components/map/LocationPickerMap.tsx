"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L, { type LeafletEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { getValidMapPosition, type MapPosition } from "@/lib/domain/coordinates";

const createMarkerIcon = () => L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="
    background-color: var(--primary);
    width: 22px;
    height: 22px;
    margin: 5px;
    border-radius: 50% 50% 50% 0;
    border: 3px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.35);
    transform: rotate(-45deg);
  "></div>`,
  iconSize: [32, 36],
  iconAnchor: [16, 34],
});

export type LocationSelectionSource = "map" | "drag";

interface LocationPickerMapProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationSelect: (latitude: number, longitude: number, source: LocationSelectionSource) => void;
}

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const INDONESIA_CENTER: MapPosition = [-2.5, 118];

function LocationSelector({
  onLocationSelect,
}: Pick<LocationPickerMapProps, "onLocationSelect">) {
  useMapEvents({
    click(event) {
      onLocationSelect(event.latlng.lat, event.latlng.lng, "map");
    },
  });
  return null;
}

function MapViewportController({ position }: { position: MapPosition | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, Math.max(map.getZoom(), 13), { animate: false });
    } else {
      map.setView(INDONESIA_CENTER, 5, { animate: false });
    }
  }, [map, position]);

  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationSelect,
}: LocationPickerMapProps) {
  const position = getValidMapPosition(latitude, longitude);
  const markerIcon = useMemo(() => createMarkerIcon(), []);
  const markerEventHandlers = useMemo(() => ({
    dragend(event: LeafletEvent) {
      const marker = event.target as L.Marker;
      const nextPosition = marker.getLatLng();
      onLocationSelect(nextPosition.lat, nextPosition.lng, "drag");
    },
  }), [onLocationSelect]);

  return (
    <div className="relative z-0 h-full w-full">
      <MapContainer
        center={position || INDONESIA_CENTER}
        zoom={position ? 13 : 5}
        className="h-full w-full"
        aria-label="Peta pemilih lokasi acara"
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <LocationSelector onLocationSelect={onLocationSelect} />
        <MapViewportController position={position} />

        {position && (
          <Marker
            position={position}
            icon={markerIcon}
            draggable
            eventHandlers={markerEventHandlers}
            title="Geser marker untuk memperbarui lokasi acara"
          />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute left-12 top-2 z-[400] max-w-[calc(100%-4rem)] rounded-md border bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur">
        {position
          ? "Klik peta atau geser marker untuk memperbaiki lokasi"
          : "Lokasi belum dipilih. Cari alamat atau klik peta."}
      </div>
    </div>
  );
}
