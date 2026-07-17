import { describe, expect, it } from "vitest";
import { AudioUploadError, hasMp3Signature, MAX_EVENT_AUDIO_BYTES, parseEventAudioUpload } from "@/server/event-audio";

function mp3File(name = "musik.mp3") {
  return new File([new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00])], name, { type: "audio/mpeg" });
}

describe("validasi upload MP3 acara", () => {
  it("mengenali header ID3 dan MPEG frame sync", () => {
    expect(hasMp3Signature(new Uint8Array([0x49, 0x44, 0x33]))).toBe(true);
    expect(hasMp3Signature(new Uint8Array([0xff, 0xfb, 0x90]))).toBe(true);
    expect(hasMp3Signature(new Uint8Array([0x00, 0x01, 0x02]))).toBe(false);
  });

  it("mengubah MP3 valid menjadi data BLOB", async () => {
    const formData = new FormData();
    formData.set("audioAction", "REPLACE");
    formData.set("audioFile", mp3File());

    const result = await parseEventAudioUpload(formData, false);
    expect(result.audioFileName).toBe("musik.mp3");
    expect(result.audioMimeType).toBe("audio/mpeg");
    expect(result.audioData).toBeInstanceOf(Buffer);
  });

  it("menolak file palsu dan file yang terlalu besar", async () => {
    const fake = new FormData();
    fake.set("audioAction", "REPLACE");
    fake.set("audioFile", new File([new Uint8Array([0x00, 0x01, 0x02])], "palsu.mp3", { type: "audio/mpeg" }));
    await expect(parseEventAudioUpload(fake, false)).rejects.toThrow(AudioUploadError);

    const oversized = new FormData();
    oversized.set("audioAction", "REPLACE");
    oversized.set("audioFile", new File([new Uint8Array(MAX_EVENT_AUDIO_BYTES + 1)], "besar.mp3", { type: "audio/mpeg" }));
    await expect(parseEventAudioUpload(oversized, false)).rejects.toThrow("maksimal 10 MB");
  });

  it("mengosongkan seluruh metadata saat musik dihapus", async () => {
    const formData = new FormData();
    formData.set("audioAction", "REMOVE");
    await expect(parseEventAudioUpload(formData, true)).resolves.toEqual({
      audioData: null,
      audioMimeType: null,
      audioFileName: null,
      audioSize: null,
    });
  });
});
