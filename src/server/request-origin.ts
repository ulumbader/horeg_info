import "server-only";

import type { NextRequest } from "next/server";

export function hasTrustedMutationOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV === "test";

  const trusted = new Set<string>([new URL(request.url).origin]);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol ?? request.nextUrl.protocol.replace(":", "");
  if (host && (protocol === "http" || protocol === "https")) {
    trusted.add(`${protocol}://${host}`);
  }
  for (const configured of [process.env.NEXT_PUBLIC_APP_URL, process.env.BETTER_AUTH_URL]) {
    if (!configured) continue;
    try {
      trusted.add(new URL(configured).origin);
    } catch {
      // Environment validation reports malformed URLs elsewhere.
    }
  }
  for (const configured of (process.env.TRUSTED_ORIGINS ?? "").split(",")) {
    if (!configured.trim()) continue;
    try {
      trusted.add(new URL(configured.trim()).origin);
    } catch {
      // Ignore malformed optional entries instead of trusting them.
    }
  }

  return trusted.has(origin);
}
