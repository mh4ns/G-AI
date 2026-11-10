import { expect, type Page } from "@playwright/test";
import { URLS } from "./urls";

/** Walks the onboarding quiz with its default answers and skips the photo step. */
export async function completeQuiz(page: Page) {
  await expect(page).toHaveURL(`${URLS.app}/quiz`);
  // Step 1: archetype card (a clickable card, not a button).
  await page.getByText("Nữ Giới • Pilates & Core").click();
  // Steps 2-4: keep the defaults.
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Tiếp Tục" }).click();
  }
  // Step 5: obstacles, then generate.
  await page.getByRole("button", { name: /Tạo Giáo Án 28 Ngày/ }).click();
  // Step 6: photo is optional.
  await page.getByRole("button", { name: /Bỏ qua & dùng hình thể mẫu/ }).click();
  // Step 7 is an animated "analyzing" loader; step 8 is the result.
  await expect(page.getByText("Kế Hoạch Đã Khởi Tạo Thành Công!")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: /Lộ Trình 28 Ngày/ })).toBeVisible();
}

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Fails when the page is wider than the viewport (horizontal scrolling). */
export async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, viewport } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${viewport}px viewport`).toBeLessThanOrEqual(viewport);
}
