import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ANONYMOUS_COOKIE_NAME = "horeg_ews_anonymous_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getSecret() {
  const secret = process.env.ANONYMOUS_ID_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ANONYMOUS_ID_SECRET atau BETTER_AUTH_SECRET minimal 32 karakter wajib tersedia");
  }
  return secret;
}

function sign(identifier: string) {
  return createHmac("sha256", getSecret()).update(`cookie:${identifier}`).digest("base64url");
}

function verifySignedValue(value: string | undefined) {
  if (!value) return null;
  const [identifier, signature, extra] = value.split(".");
  if (!identifier || !signature || extra || !/^[A-Za-z0-9_-]{32}$/.test(identifier)) return null;

  const expected = Buffer.from(sign(identifier));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return identifier;
}

export function resolveAnonymousIdentity(request: NextRequest) {
  const existing = verifySignedValue(request.cookies.get(ANONYMOUS_COOKIE_NAME)?.value);
  const identifier = existing ?? randomBytes(24).toString("base64url");
  const actorHash = createHmac("sha256", getSecret()).update(`actor:${identifier}`).digest("hex");

  return {
    actorHash,
    cookieValue: existing ? null : `${identifier}.${sign(identifier)}`,
  };
}

export function applyAnonymousIdentityCookie(response: NextResponse, cookieValue: string | null) {
  if (!cookieValue) return response;
  response.cookies.set(ANONYMOUS_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
