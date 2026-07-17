import { expect, test } from "@playwright/test";

const eventSlug = "acara-e2e-terdahulu";
const eventTitle = "Acara E2E Terdahulu";

test("pengunjung membagikan acara dan menyalin URL stabil", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get: () => ({
        writeText: async (value: string) => {
          (window as Window & { __copiedShareUrl?: string }).__copiedShareUrl = value;
        },
      }),
    });
  });

  await page.goto(`/?status=past&event=${eventSlug}`);
  await page.getByRole("button", { name: `Bagikan acara ${eventTitle}` }).click();

  const shareDialog = page.getByRole("dialog", { name: "Share to" });
  await expect(shareDialog).toBeVisible();
  await expect(shareDialog.getByRole("link", { name: "Bagikan ke WhatsApp" })).toHaveAttribute("href", /wa\.me/);
  await expect(shareDialog.getByRole("link", { name: "Bagikan ke Facebook" })).toHaveAttribute("href", /facebook\.com/);
  await expect(shareDialog.getByRole("button", { name: "Bagikan ke Instagram" })).toBeVisible();
  await expect(shareDialog.getByRole("link", { name: "Bagikan ke X" })).toHaveAttribute("href", /twitter\.com\/intent\/tweet/);
  await expect(shareDialog.getByRole("link", { name: "Bagikan ke Telegram" })).toHaveAttribute("href", /t\.me\/share\/url/);

  await shareDialog.getByRole("button", { name: "Salin URL acara" }).click();
  await expect(shareDialog.getByRole("status")).toHaveText("Tautan acara berhasil disalin.");

  const copiedUrl = await page.evaluate(() => (window as Window & { __copiedShareUrl?: string }).__copiedShareUrl);
  expect(copiedUrl).toBe(`http://127.0.0.1:3100/?event=${eventSlug}`);

  await shareDialog.getByRole("button", { name: "Tutup dialog bagikan" }).click();
  await expect(shareDialog).toBeHidden();
});

test("dialog share mobile menutup sementara lalu memulihkan panel detail", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`/?event=${eventSlug}`);

  const detailDialog = page.getByRole("dialog", { name: `Detail acara ${eventTitle}` });
  await expect(detailDialog).toBeVisible();
  await detailDialog.getByRole("button", { name: `Bagikan acara ${eventTitle}` }).click();

  const shareDialog = page.getByRole("dialog", { name: "Share to" });
  await expect(shareDialog).toBeVisible();
  await expect(detailDialog).toBeHidden();

  await shareDialog.getByRole("button", { name: "Tutup dialog bagikan" }).click();
  await expect(shareDialog).toBeHidden();
  await expect(detailDialog).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`event=${eventSlug}`));
});
