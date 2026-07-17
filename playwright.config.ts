import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_DATABASE_URL, E2E_DIRECT_URL } from "./e2e/constants";

process.env.DATABASE_URL = E2E_DATABASE_URL;
process.env.DIRECT_URL = E2E_DIRECT_URL;
process.env.BETTER_AUTH_URL = E2E_BASE_URL;
process.env.NEXT_PUBLIC_APP_URL = E2E_BASE_URL;
process.env.BETTER_AUTH_SECRET = "e2e-only-secret-at-least-thirty-two-characters";
process.env.TRUSTED_ORIGINS = E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run test:e2e:setup && npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      DIRECT_URL: E2E_DIRECT_URL,
      BETTER_AUTH_URL: E2E_BASE_URL,
      NEXT_PUBLIC_APP_URL: E2E_BASE_URL,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      TRUSTED_ORIGINS: E2E_BASE_URL,
    },
  },
});
