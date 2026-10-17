import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { test, expect } from "@playwright/test";

let css: string;

function renderChart(data: { date: string; count: number }[]): string {
  // Render outside Playwright's JSX transform, which produces component-test descriptors.
  return execFileSync(process.execPath, ["--import", "tsx", "--eval", `
    const { createElement } = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const { MiniBarChart } = require('./src/components/admin/AnalyticsWidgets.tsx');
    const data = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
    process.stdout.write(renderToStaticMarkup(createElement(MiniBarChart, { data })));
  `], { input: JSON.stringify(data), encoding: "utf8" });
}

test.beforeAll(async () => {
  const from = path.resolve("src/app/globals.css");
  css = (await postcss([tailwindcss()]).process(await readFile(from, "utf8"), { from })).css;
});

// Exercise the real component and compiled stylesheet without admin credentials or database writes.
test("batang proporsional, nilai nol, dan label terbaca di semua viewport dan tema", async ({ page }) => {
  const counts = [0, 31, 62, 124, 1, 0, 31];
  const data = counts.map((count, index) => ({ date: `2026-10-${12 + index}`, count }));
  const markup = renderChart(data);

  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    for (const theme of ["", "dark"]) {
      await page.setContent(`<html class="${theme}"><body><main class="p-6 bg-card text-card-foreground">${markup}</main></body></html>`);
      await page.addStyleTag({ content: css });
      const chart = page.getByRole("img", { name: /Grafik kunjungan/ });
      await expect(chart).toBeVisible();
      await expect(chart).toHaveAccessibleName(/2026-10-18: 31 kunjungan/);
      const heights = await chart.locator("[title]").evaluateAll((bars) => bars.map((bar) => bar.getBoundingClientRect().height));
      expect(heights[0]).toBe(0);
      expect(heights[3]).toBeGreaterThan(40);
      expect(heights[1] / heights[3]).toBeCloseTo(0.25, 1);
      expect(heights[2] / heights[3]).toBeCloseTo(0.5, 1);
      expect(heights[4]).toBeGreaterThanOrEqual(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }

  await page.setContent(renderChart(data.map((day) => ({ ...day, count: 0 }))));
  await page.addStyleTag({ content: css });
  await expect(page.getByText("Belum ada kunjungan dalam 7 hari terakhir.")).toBeVisible();
  const emptyHeights = await page.locator("[title]").evaluateAll((bars) => bars.map((bar) => bar.getBoundingClientRect().height));
  expect(emptyHeights).toEqual([0, 0, 0, 0, 0, 0, 0]);
});
