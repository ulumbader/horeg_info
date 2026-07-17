import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import {
  geocodingQuerySchema,
  mapNominatimResults,
  type GeocodingResult,
} from "@/lib/geocoding";

export const runtime = "nodejs";

const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const CACHE_MAX_ENTRIES = 100;
const REQUEST_INTERVAL_MS = 1_050;

interface CacheEntry {
  expiresAt: number;
  results: GeocodingResult[];
}

const responseCache = new Map<string, CacheEntry>();
let requestQueue: Promise<void> = Promise.resolve();
let nextRequestAt = 0;

function getCachedResults(cacheKey: string) {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }

  return cached.results;
}

function cacheResults(cacheKey: string, results: GeocodingResult[]) {
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }

  responseCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    results,
  });
}

async function runRateLimited<T>(operation: () => Promise<T>): Promise<T> {
  const previousRequest = requestQueue;
  let releaseQueue: (() => void) | undefined;
  requestQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });

  await previousRequest;

  try {
    const waitMs = Math.max(0, nextRequestAt - Date.now());
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    nextRequestAt = Date.now() + REQUEST_INTERVAL_MS;
    return await operation();
  } finally {
    releaseQueue?.();
  }
}

function getProviderConfiguration() {
  const baseUrl = process.env.GEOCODING_BASE_URL || "https://nominatim.openstreetmap.org";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const userAgent = process.env.GEOCODING_USER_AGENT || `SoundHoregEWS/0.1 (+${appUrl})`;

  const url = new URL("/search", baseUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Protokol provider geocoding tidak didukung");
  }

  return { url, userAgent };
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const queryResult = geocodingQuerySchema.safeParse(searchParams.get("q") || "");
  if (!queryResult.success) {
    return NextResponse.json(
      { error: queryResult.error.issues[0]?.message || "Kata pencarian tidak valid" },
      { status: 400 },
    );
  }

  const query = queryResult.data;
  const cacheKey = query.toLocaleLowerCase("id-ID");
  const cachedResults = getCachedResults(cacheKey);
  if (cachedResults) {
    return NextResponse.json({ results: cachedResults });
  }

  try {
    const { url, userAgent } = getProviderConfiguration();
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "id");
    url.searchParams.set("accept-language", "id");
    url.searchParams.set("limit", "5");

    const results = await runRateLimited(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);

      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": userAgent,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const status = response.status === 429 ? 429 : 502;
          throw Object.assign(new Error("Provider geocoding gagal merespons"), { status });
        }

        return mapNominatimResults(await response.json());
      } finally {
        clearTimeout(timeout);
      }
    });

    cacheResults(cacheKey, results);
    return NextResponse.json({ results });
  } catch (error: unknown) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    const status = isAbort
      ? 504
      : typeof error === "object" && error !== null && "status" in error && error.status === 429
        ? 429
        : 502;

    const message = status === 429
      ? "Pencarian terlalu cepat. Tunggu sebentar lalu coba lagi."
      : status === 504
        ? "Pencarian lokasi melewati batas waktu."
        : "Layanan pencarian lokasi sedang tidak tersedia.";

    return NextResponse.json({ error: message }, { status });
  }
}

