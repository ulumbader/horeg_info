import "server-only";

export const MAX_EVENT_AUDIO_BYTES = 10 * 1024 * 1024;

export class AudioUploadError extends Error {}

export type EventAudioMutation = {
  audioData?: Buffer | null;
  audioMimeType?: string | null;
  audioFileName?: string | null;
  audioSize?: number | null;
};

export function hasMp3Signature(bytes: Uint8Array) {
  if (bytes.length < 3) return false;
  const hasId3Header = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const hasMpegFrameSync = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  return hasId3Header || hasMpegFrameSync;
}

function sanitizeFileName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).at(-1) ?? "musik-acara.mp3";
  const sanitized = baseName.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return (sanitized || "musik-acara.mp3").slice(0, 255);
}

function isFileEntry(value: FormDataEntryValue | null): value is File {
  return value !== null && typeof value !== "string" && typeof value.arrayBuffer === "function";
}

export async function parseEventAudioUpload(
  formData: FormData | undefined,
  allowKeep: boolean,
): Promise<EventAudioMutation> {
  const action = formData?.get("audioAction");
  if (!formData || action === null || action === "KEEP") {
    if (allowKeep) return {};
    return { audioData: null, audioMimeType: null, audioFileName: null, audioSize: null };
  }

  if (action === "REMOVE") {
    return { audioData: null, audioMimeType: null, audioFileName: null, audioSize: null };
  }

  if (action !== "REPLACE") throw new AudioUploadError("Aksi file musik tidak valid");

  const file = formData.get("audioFile");
  if (!isFileEntry(file) || file.size === 0) throw new AudioUploadError("File MP3 wajib dipilih");
  if (file.size > MAX_EVENT_AUDIO_BYTES) throw new AudioUploadError("Ukuran file MP3 maksimal 10 MB");

  const fileName = sanitizeFileName(file.name);
  const mimeType = file.type.toLowerCase();
  if (!fileName.toLowerCase().endsWith(".mp3") || !["audio/mpeg", "audio/mp3"].includes(mimeType)) {
    throw new AudioUploadError("File musik harus berformat MP3");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasMp3Signature(bytes)) throw new AudioUploadError("Isi file tidak dikenali sebagai MP3 yang valid");

  return {
    audioData: Buffer.from(bytes),
    audioMimeType: "audio/mpeg",
    audioFileName: fileName,
    audioSize: file.size,
  };
}
