import { describe, expect, it } from "vitest";
import { geocodingQuerySchema, mapNominatimResults } from "@/lib/geocoding";

describe("geocoding admin", () => {
  it("menormalisasi kata pencarian dan membatasi panjang input", () => {
    expect(geocodingQuerySchema.parse("  Lapangan Kepanjen  ")).toBe("Lapangan Kepanjen");
    expect(geocodingQuerySchema.safeParse("ab").success).toBe(false);
    expect(geocodingQuerySchema.safeParse("a".repeat(201)).success).toBe(false);
  });

  it("memetakan hasil Nominatim yang memiliki koordinat valid", () => {
    expect(mapNominatimResults([
      {
        place_id: 123,
        display_name: "Lapangan Kepanjen, Malang, Jawa Timur, Indonesia",
        lat: "-8.1303",
        lon: "112.5727",
      },
    ])).toEqual([
      {
        id: "123",
        label: "Lapangan Kepanjen, Malang, Jawa Timur, Indonesia",
        latitude: -8.1303,
        longitude: 112.5727,
      },
    ]);
  });

  it("mengabaikan payload atau koordinat provider yang tidak aman", () => {
    expect(mapNominatimResults({ error: "invalid" })).toEqual([]);
    expect(mapNominatimResults([
      { place_id: 1, display_name: "Invalid", lat: "NaN", lon: "112" },
      { place_id: 2, display_name: "Out of range", lat: "-91", lon: "112" },
    ])).toEqual([]);
  });
});

