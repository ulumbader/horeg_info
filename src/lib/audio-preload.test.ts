import { describe, expect, it } from "vitest";
import { getAudioPreloadUrls, shouldPreloadAudio } from "./audio-preload";

describe("shouldPreloadAudio", () => {
  it("mengizinkan preload pada koneksi normal atau saat API koneksi tidak tersedia", () => {
    expect(shouldPreloadAudio()).toBe(true);
    expect(shouldPreloadAudio({ effectiveType: "4g" })).toBe(true);
    expect(shouldPreloadAudio({ effectiveType: "3g" })).toBe(true);
  });

  it("menonaktifkan preload agresif untuk Data Saver dan koneksi sangat lambat", () => {
    expect(shouldPreloadAudio({ saveData: true, effectiveType: "4g" })).toBe(false);
    expect(shouldPreloadAudio({ effectiveType: "2g" })).toBe(false);
    expect(shouldPreloadAudio({ effectiveType: "slow-2g" })).toBe(false);
  });
});

describe("getAudioPreloadUrls", () => {
  const events = [
    { slug: "pertama", audioStreamUrl: "/audio/1" },
    { slug: "tanpa-audio", audioStreamUrl: null },
    { slug: "kedua", audioStreamUrl: "/audio/2" },
    { slug: "duplikat", audioStreamUrl: "/audio/1" },
  ];

  it("mengabaikan URL kosong dan menghapus duplikat", () => {
    expect(getAudioPreloadUrls(events)).toEqual(["/audio/1", "/audio/2"]);
  });

  it("mendahulukan musik dari acara yang sedang dipilih", () => {
    expect(getAudioPreloadUrls(events, "kedua")).toEqual(["/audio/2", "/audio/1"]);
  });
});
