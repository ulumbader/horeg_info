import globalSetup from "./global-setup";

void globalSetup().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Setup E2E gagal.");
  process.exitCode = 1;
});
