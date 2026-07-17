import { expect, test } from "@playwright/test";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./constants";

const publicComment = "Komentar anonim dari pengujian engagement";
const adminComment = "Pengumuman admin dari pengujian engagement";

test("pengunjung memberi like/komentar dan admin memoderasi", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/?event=acara-e2e-terdahulu");

  const likeButton = page.getByRole("button", { name: /^Like acara/ }).first();
  await expect(likeButton).toHaveAttribute("aria-pressed", "false");
  const likeResponsePromise = page.waitForResponse((response) => response.url().endsWith("/like") && response.request().method() === "PUT");
  await likeButton.click();
  expect((await likeResponsePromise).ok()).toBe(true);
  await expect(page.getByRole("button", { name: /^Batalkan like/ }).first()).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /^Buka komentar/ }).first().click();
  await expect(page).toHaveURL(/panel=comments/);
  await page.getByLabel("Tulis komentar anonim").fill(publicComment);
  const commentResponsePromise = page.waitForResponse((response) => response.url().endsWith("/comments") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Kirim komentar" }).click();
  expect((await commentResponsePromise).ok()).toBe(true);
  await expect(page.locator("article", { hasText: publicComment })).toBeVisible();

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/comments");

  const anonymousCard = page.locator("article", { hasText: publicComment });
  await expect(anonymousCard.getByRole("button", { name: "Edit komentar admin" })).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await anonymousCard.getByRole("button", { name: "Hapus komentar" }).click();
  await expect(page.getByText(publicComment)).toHaveCount(0);

  await page.getByLabel("Acara").selectOption({ label: "Acara E2E Terdahulu (PUBLISHED)" });
  await page.getByLabel("Komentar", { exact: true }).fill(adminComment);
  await page.getByRole("button", { name: "Tambah komentar" }).click();
  const adminCard = page.locator("article", { hasText: adminComment });
  await expect(adminCard).toContainText("ADMIN");
  await adminCard.getByRole("button", { name: "Edit komentar admin" }).click();
  await adminCard.locator("textarea").fill(`${adminComment} diedit`);
  await adminCard.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByText(`${adminComment} diedit`)).toBeVisible();

  await page.goto("/?event=acara-e2e-terdahulu&panel=comments");
  await expect(page.getByText(`${adminComment} diedit`)).toBeVisible();
  await expect(page.getByText("ADMIN").first()).toBeVisible();
});
