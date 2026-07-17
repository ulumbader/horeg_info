import { z } from "zod";
import { getValidMapPosition } from "@/lib/domain/coordinates";

export const geocodingQuerySchema = z.string()
  .trim()
  .min(3, "Kata pencarian minimal 3 karakter")
  .max(200, "Kata pencarian maksimal 200 karakter");

const nominatimResultSchema = z.object({
  place_id: z.union([z.string(), z.number()]),
  display_name: z.string().min(1),
  lat: z.string(),
  lon: z.string(),
});

const nominatimResponseSchema = z.array(nominatimResultSchema);

export interface GeocodingResult {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

export function mapNominatimResults(payload: unknown): GeocodingResult[] {
  const parsed = nominatimResponseSchema.safeParse(payload);
  if (!parsed.success) return [];

  return parsed.data.flatMap((item) => {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    const position = getValidMapPosition(latitude, longitude);

    if (!position) return [];

    return [{
      id: String(item.place_id),
      label: item.display_name,
      latitude: position[0],
      longitude: position[1],
    }];
  });
}

