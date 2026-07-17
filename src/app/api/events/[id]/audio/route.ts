import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rangeNotSatisfiable(totalSize: number) {
  return new Response(null, {
    status: 416,
    headers: { "Content-Range": `bytes */${totalSize}` },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || id.length > 128) return new Response("Tidak ditemukan", { status: 404 });

  const event = await prisma.soundEvent.findUnique({
    where: { id },
    select: {
      publicationStatus: true,
      audioData: true,
      audioMimeType: true,
      audioFileName: true,
      audioSize: true,
    },
  });

  if (!event?.audioData || !event.audioSize) return new Response("Tidak ditemukan", { status: 404 });

  if (event.publicationStatus !== "PUBLISHED") {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Tidak ditemukan", { status: 404 });
  }

  const audio = event.audioData;
  const totalSize = audio.byteLength;
  const rangeHeader = request.headers.get("range");
  let start = 0;
  let end = totalSize - 1;
  let status = 200;

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match || (!match[1] && !match[2])) return rangeNotSatisfiable(totalSize);

    if (!match[1]) {
      const suffixLength = Number(match[2]);
      if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return rangeNotSatisfiable(totalSize);
      start = Math.max(totalSize - suffixLength, 0);
    } else {
      start = Number(match[1]);
    }
    if (match[2] && match[1]) end = Number(match[2]);

    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= totalSize || end < start) {
      return rangeNotSatisfiable(totalSize);
    }
    end = Math.min(end, totalSize - 1);
    status = 206;
  }

  const chunk = Uint8Array.from(audio.subarray(start, end + 1));
  const fileName = encodeURIComponent(event.audioFileName ?? "musik-acara.mp3");
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": event.publicationStatus === "PUBLISHED"
      ? "public, max-age=31536000, immutable"
      : "private, no-store",
    "Content-Disposition": `inline; filename*=UTF-8''${fileName}`,
    "Content-Length": String(chunk.byteLength),
    "Content-Type": event.audioMimeType ?? "audio/mpeg",
  });
  if (status === 206) headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);

  return new Response(chunk, { status, headers });
}
