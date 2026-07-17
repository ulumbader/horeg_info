import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_EVENT_TITLE } from "./constants";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe.serial("FASE 11 quality gate", () => {
  test("login salah menampilkan pesan generik dan public signup ditolak", async ({ page, request }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("tidak-ada@example.test");
    await page.getByLabel("Password", { exact: true }).fill("Password-Salah-123!");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Email atau password tidak valid." })).toBeVisible();

    const response = await request.post("/api/auth/sign-up/email", {
      data: { email: "intruder@example.test", name: "Intruder", password: "Intruder-Password-123!" },
    });
    expect(response.ok()).toBe(false);
  });

  test("login benar dan admin membuat draft", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Tambah Acara Baru" }).first().click();
    await page.getByLabel("Judul Acara *").fill(E2E_EVENT_TITLE);
    await page.getByLabel("Ringkasan Singkat").fill("Data khusus pengujian alur quality gate.");
    await page.getByLabel("Waktu Mulai *").fill("2027-08-01T10:00");
    await page.getByLabel("Waktu Selesai *").fill("2027-08-01T14:00");
    await page.getByLabel("Nama Lokasi/Venue").fill("Lapangan Quality Gate");
    await page.getByLabel("Alamat Lengkap *").fill("Jalan Quality Gate Nomor 11");
    await page.getByLabel("Kabupaten/Kota *").fill("Malang");
    await page.getByLabel("Provinsi *").fill("Jawa Timur");
    await page.getByLabel("Platform Sumber *").fill("Situs Resmi");
    await page.getByLabel("URL Referensi *").fill("https://example.com/quality-gate");
    await page.getByLabel("Estimasi Volume Sumber (dB) *").fill("120");
    await page.getByLabel("Latitude").fill("-7.9839");
    await page.getByLabel("Longitude").fill("112.6214");
    await page.getByLabel("Status Publikasi").selectOption("DRAFT");
    await page.getByRole("button", { name: "Buat Acara" }).click();
    await expect(page).toHaveURL(/\/admin\/events$/);
    await expect(page.getByText(E2E_EVENT_TITLE).first()).toBeVisible();
    const eventRow = page.locator("tr", { hasText: E2E_EVENT_TITLE });
    await expect(eventRow.getByText("Draft", { exact: true })).toBeVisible();
  });

  test("admin mengedit lalu publish dan acara tampil serta dapat dipilih di publik", async ({ page }) => {
    await login(page);
    await page.goto("/admin/events");
    const row = page.locator("tr", { hasText: E2E_EVENT_TITLE });
    await row.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Ringkasan Singkat").fill("Ringkasan telah diedit dan dipublikasikan.");
    await page.getByLabel("Status Publikasi").selectOption("PUBLISHED");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();
    await expect(page).toHaveURL(/\/admin\/events$/);

    await page.goto("/");
    await page.getByRole("button", { name: new RegExp(E2E_EVENT_TITLE) }).click();
    await expect(page).toHaveURL(/event=festival-horeg-quality-gate/);
    await expect(page.getByRole("heading", { name: E2E_EVENT_TITLE }).last()).toBeVisible();
    await page.getByPlaceholder("Cari acara atau lokasi...").fill("Quality Gate");
    await page.getByPlaceholder("Cari acara atau lokasi...").press("Enter");
    await expect(page).toHaveURL(/search=Quality\+Gate/);

    await page.setViewportSize({ width: 360, height: 800 });
    const legendButton = page.getByRole("button", { name: "Buka legenda peta" });
    await expect(legendButton).toBeVisible();
    await expect(legendButton).toHaveAttribute("aria-expanded", "false");
    await legendButton.click();
    await expect(page.getByRole("heading", { name: "Legenda Peta" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tutup legenda peta" })).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("button", { name: "Tutup legenda peta" }).click();
    await expect(page.getByRole("heading", { name: "Legenda Peta" })).toBeHidden();

    const mobileSearch = page.getByPlaceholder("Cari acara...");
    await mobileSearch.fill("Quality Gate");
    await page.getByRole("button", { name: "Cari acara", exact: true }).click();
    await expect(page.getByRole("button", { name: "Tampilan daftar" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status").filter({ hasText: "1 acara ditemukan untuk “Quality Gate”." })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(E2E_EVENT_TITLE) }).click();
    await expect(page.getByRole("button", { name: "Tampilan peta" })).toHaveAttribute("aria-pressed", "true");

    await mobileSearch.fill("Acara yang tidak tersedia");
    await mobileSearch.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Tidak ada acara ditemukan untuk “Acara yang tidak tersedia”." })).toBeVisible();
    await expect(page.getByText("Tidak ada acara yang cocok dengan pencarian “Acara yang tidak tersedia”.")).toBeVisible();
  });

  test("theme toggle, geolocation success/denied, dan overflow viewport lulus", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: -7.9839, longitude: 112.6214 } } as GeolocationPosition),
        },
      });
    });
    await page.goto("/");
    const themeButton = page.getByRole("button", { name: "Ganti tema warna" });
    await themeButton.click();
    await expect(page.locator("html")).toHaveClass(/(dark|light)/);
    await page.getByRole("button", { name: "Cek posisi saya" }).first().click();
    await expect(page.getByRole("heading", { name: "Estimasi di Lokasi Anda" }).first()).toBeVisible();

    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `overflow horizontal pada ${width}px`).toBeLessThanOrEqual(1);
    }

    await page.reload();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => error({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "denied" } as GeolocationPositionError),
        },
      });
    });
    await page.reload();
    await page.getByRole("button", { name: "Cek posisi saya" }).first().click();
    await expect(page.getByRole("status")).toContainText("Izin lokasi ditolak");
  });

  test("admin mengarsipkan acara dan acara hilang dari publik", async ({ page }) => {
    await login(page);
    await page.goto("/admin/events");
    const row = page.locator("tr", { hasText: E2E_EVENT_TITLE });
    await row.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Status Publikasi").selectOption("ARCHIVED");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();
    await expect(page).toHaveURL(/\/admin\/events$/);
    await page.goto("/");
    await expect(page.getByText(E2E_EVENT_TITLE)).toHaveCount(0);
  });
});
