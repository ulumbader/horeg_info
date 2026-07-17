import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ANONYMOUS_COOKIE_NAME, resolveAnonymousIdentity } from "@/server/anonymous-identity";
import { hasTrustedMutationOrigin } from "@/server/request-origin";

describe("identitas browser anonim", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("menghasilkan cookie bertanda tangan dan actor hash yang stabil", () => {
    vi.stubEnv("ANONYMOUS_ID_SECRET", "unit-test-anonymous-secret-with-32-characters");
    const first = resolveAnonymousIdentity(new NextRequest("http://localhost:3000/"));
    expect(first.cookieValue).toBeTruthy();

    const repeated = resolveAnonymousIdentity(new NextRequest("http://localhost:3000/", {
      headers: { cookie: `${ANONYMOUS_COOKIE_NAME}=${first.cookieValue}` },
    }));
    expect(repeated.cookieValue).toBeNull();
    expect(repeated.actorHash).toBe(first.actorHash);
    expect(repeated.actorHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("menolak cookie yang dimodifikasi", () => {
    vi.stubEnv("ANONYMOUS_ID_SECRET", "unit-test-anonymous-secret-with-32-characters");
    const first = resolveAnonymousIdentity(new NextRequest("http://localhost:3000/"));
    const tampered = `${first.cookieValue}x`;
    const replacement = resolveAnonymousIdentity(new NextRequest("http://localhost:3000/", {
      headers: { cookie: `${ANONYMOUS_COOKIE_NAME}=${tampered}` },
    }));
    expect(replacement.cookieValue).toBeTruthy();
    expect(replacement.actorHash).not.toBe(first.actorHash);
  });
});

describe("pemeriksaan origin mutasi publik", () => {
  it("menerima origin yang sama dengan host aktual", () => {
    const request = new NextRequest("http://localhost:3000/api/events/acara/like", {
      headers: { host: "127.0.0.1:3200", origin: "http://127.0.0.1:3200" },
    });
    expect(hasTrustedMutationOrigin(request)).toBe(true);
  });

  it("menolak origin asing", () => {
    const request = new NextRequest("https://soundhoreg.example/api/events/acara/like", {
      headers: { host: "soundhoreg.example", origin: "https://attacker.example" },
    });
    expect(hasTrustedMutationOrigin(request)).toBe(false);
  });
});
