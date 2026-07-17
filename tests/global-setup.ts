import { execFileSync } from "node:child_process";
import path from "node:path";

export default function setup() {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  const directUrl = process.env.TEST_DIRECT_URL;
  if (!databaseUrl || !directUrl) return;

  for (const value of [databaseUrl, directUrl]) {
    const url = new URL(value);
    const schema = url.searchParams.get("schema");
    if (!url.protocol.startsWith("postgres") || !schema || !schema.startsWith("vitest")) {
      throw new Error("Database Vitest wajib PostgreSQL dengan schema terisolasi berawalan 'vitest'.");
    }
  }

  const prismaCli = path.resolve(process.cwd(), "node_modules/prisma/build/index.js");
  execFileSync(process.execPath, [prismaCli, "migrate", "reset", "--force", "--skip-seed"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl, RUST_LOG: "info", RUST_BACKTRACE: "1" },
    stdio: "pipe",
  });
}
