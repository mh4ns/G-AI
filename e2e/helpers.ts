import { expect, type Page } from "@playwright/test";
import { URLS } from "./urls";

/** Walks the onboarding quiz with its default answers and skips the photo step. */
export async function completeQuiz(page: Page) {
  await expect(page).toHaveURL(`${URLS.app}/quiz`);
  // Step 1: programme card (a button with aria-pressed).
  await page.getByRole("button", { name: /Pilates & cơ lõi/ }).click();
  // Steps 2-4: keep the defaults.
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Tiếp tục" }).click();
  }
  // Step 5: obstacles, then generate.
  await page.getByRole("button", { name: /Tạo giáo án 28 ngày/ }).click();
  // Step 6: photo is optional.
  await page.getByRole("button", { name: /Bỏ qua, dùng hình mẫu/ }).click();
  // Step 7 is an animated "analyzing" loader; step 8 is the result.
  await expect(page.getByRole("heading", { level: 1, name: /Lộ trình 28 ngày/ })).toBeVisible({ timeout: 30_000 });
}

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Today renders whole numbers with `toLocaleString("vi-VN")`, which groups thousands with "."
 * (2100 -> "2.100"). These helpers format and parse that the same way.
 */
const VI_NUMBER = String.raw`\d{1,3}(?:\.\d{3})*`;

export function formatViNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseViNumber(text: string): number {
  return Number(text.replace(/\./g, ""));
}

/** The "<drunk> / <goal> ml" line on the Today water habit. */
export function waterLine(page: Page) {
  return page.getByText(new RegExp(`^${VI_NUMBER} / ${VI_NUMBER} ml$`));
}

/** Matches a water line whose drunk amount is exactly `drunkMl` (and, if given, whose goal is `goalMl`). */
export function waterText(drunkMl: number, goalMl?: number) {
  const goal = goalMl == null ? VI_NUMBER : formatViNumber(goalMl).replace(/\./g, "\\.");
  return new RegExp(`^${formatViNumber(drunkMl).replace(/\./g, "\\.")} / ${goal} ml$`);
}

/** Reads the drunk and goal amounts from the water line. */
export async function readWater(page: Page) {
  const [drunk, goal] = (await waterLine(page).innerText()).replace(/ ml$/, "").split(" / ");
  return { drunkMl: parseViNumber(drunk), goalMl: parseViNumber(goal) };
}

export const ADD_WATER_BUTTON = { name: "Thêm 250 ml nước" } as const;

/** Fails when the page is wider than the viewport (horizontal scrolling). */
export async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, viewport } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${viewport}px viewport`).toBeLessThanOrEqual(viewport);
}
