"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { DynamicLocationPicker } from "@/components/map/DynamicLocationPicker";
import type { LocationSelectionSource } from "@/components/map/LocationPickerMap";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { GeocodingResult } from "@/lib/geocoding";

interface AdminLocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  addressParts: Array<string | null | undefined>;
  onLocationSelect: (latitude: number, longitude: number) => void;
  onClearLocation: () => void;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
  error?: string;
}

export function AdminLocationPicker({
  latitude,
  longitude,
  addressParts,
  onLocationSelect,
  onClearLocation,
}: AdminLocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [locationStatus, setLocationStatus] = useState("");

  const addressQuery = useMemo(() => Array.from(new Set(
    addressParts
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part)),
  )).join(", "), [addressParts]);

  const runSearch = useCallback(async (searchQuery: string) => {
    const normalizedQuery = searchQuery.trim();
    setQuery(normalizedQuery);
    setSearchError("");
    setResults([]);

    if (normalizedQuery.length < 3) {
      setSearchError("Masukkan minimal 3 karakter untuk mencari lokasi.");
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(`/api/admin/geocode?q=${encodeURIComponent(normalizedQuery)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await response.json() as GeocodingResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Pencarian lokasi gagal.");
      }

      const nextResults = payload.results || [];
      setResults(nextResults);
      if (nextResults.length === 0) {
        setSearchError("Lokasi tidak ditemukan. Tambahkan nama kota atau provinsi lalu coba lagi.");
      }
    } catch (error: unknown) {
      const message = error instanceof DOMException && error.name === "AbortError"
        ? "Pencarian lokasi melewati batas waktu."
        : error instanceof Error
          ? error.message
          : "Pencarian lokasi gagal.";
      setSearchError(message);
    } finally {
      window.clearTimeout(timeout);
      setIsSearching(false);
    }
  }, []);

  const handleMapLocationSelect = useCallback((
    nextLatitude: number,
    nextLongitude: number,
    source: LocationSelectionSource,
  ) => {
    onLocationSelect(nextLatitude, nextLongitude);
    setLocationStatus(source === "drag"
      ? "Lokasi diperbarui dari posisi marker."
      : "Lokasi diperbarui dari titik pada peta.");
  }, [onLocationSelect]);

  const handleResultSelect = (result: GeocodingResult) => {
    onLocationSelect(result.latitude, result.longitude);
    setResults([]);
    setQuery(result.label);
    setLocationStatus(`Lokasi dipilih: ${result.label}`);
  };

  const handleClear = () => {
    onClearLocation();
    setLocationStatus("Pilihan lokasi dihapus.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative min-w-0">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void runSearch(query);
                }
              }}
              placeholder="Cari desa, venue, alamat, atau kota..."
              aria-label="Cari alamat di peta"
              className="h-11 bg-background pl-9"
              disabled={isSearching}
            />
          </div>
          <Button
            type="button"
            onClick={() => void runSearch(query)}
            disabled={isSearching || query.trim().length < 3}
            className="h-11 gap-2"
          >
            {isSearching ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Search aria-hidden="true" className="h-4 w-4" />}
            {isSearching ? "Mencari..." : "Cari di peta"}
          </Button>
          <Button
            type="button"
            onClick={() => void runSearch(addressQuery)}
            disabled={isSearching || addressQuery.length < 3}
            className="h-11 gap-2 border border-input bg-background text-foreground hover:bg-accent"
          >
            <LocateFixed aria-hidden="true" className="h-4 w-4" />
            Gunakan alamat form
          </Button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Pencarian hanya dijalankan setelah tombol ditekan. Memilih hasil tidak akan menimpa teks alamat pada form.
        </p>

        {searchError && (
          <p role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {searchError}
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border bg-background" aria-label="Hasil pencarian lokasi">
            <ul className="divide-y divide-border">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => handleResultSelect(result)}
                    className="flex min-h-11 w-full items-start gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{result.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="border-t bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              Hasil pencarian © OpenStreetMap contributors.
            </p>
          </div>
        )}
      </div>

      <div className="relative h-[360px] overflow-hidden rounded-xl border sm:h-[420px]">
        <DynamicLocationPicker
          latitude={latitude}
          longitude={longitude}
          onLocationSelect={handleMapLocationSelect}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {locationStatus || (latitude != null && longitude != null
            ? "Lokasi siap disimpan. Marker dapat digeser untuk koreksi."
            : "Belum ada koordinat yang dipilih.")}
        </p>
        {latitude != null && longitude != null && (
          <Button
            type="button"
            onClick={handleClear}
            className="h-11 gap-2 border border-input bg-transparent text-foreground hover:bg-muted sm:h-9"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Bersihkan lokasi
          </Button>
        )}
      </div>
    </div>
  );
}

