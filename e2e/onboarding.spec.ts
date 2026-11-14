import { expect, test } from "@playwright/test";
import {
  ADD_WATER_BUTTON,
  completeQuiz,
  expectNoHorizontalScroll,
  readWater,
  waterLine,
  waterText,
} from "./helpers";
import { URLS } from "./urls";

test("hub → Coach card → quiz → plan result → guest Today", async ({ page }) => {
  await page.goto(URLS.hub);
  await page
    .getByRole("region", { name: "Sản phẩm G-AI" })
    .getByRole("link", { name: /Coach/ })
    .click();

  await completeQuiz(page);
  // Numbers come from the shared plan maths (packages/shared-types/fixtures/plan-vectors.json).
  await expect(page.getByText("CALO NGÀY")).toBeVisible();
  const plan = await page.evaluate(() => JSON.parse(localStorage.getItem("g_ai_user_plan") ?? "null"));
  expect(plan).toMatchObject({ archetype: "female_pilates" });
  expect(plan.dailyCalorieTarget).toBeGreaterThan(1000);

  await page.getByRole("button", { name: "Vào Bảng Luyện Tập Hôm Nay" }).click();
  await expect(page).toHaveURL(`${URLS.app}/today`);
  // Guest mode: local-only numbers and an invitation to sign in.
  await expect(page.getByText("Số liệu bên dưới chỉ lưu trên trình duyệt này.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng nhập để lưu tiến trình" })).toBeVisible();
  // Default quiz answers weigh 58 kg: round(58 * 35 / 100) * 100 = 2000 ml (quiz-calculations.ts).
  expect(plan.recommendedWaterMl).toBe(2000);
  // Guests start from the page's local demo value (750 ml) against the quiz plan's goal.
  await expect(waterLine(page)).toHaveText(waterText(750, plan.recommendedWaterMl));
});

test("guest Today works without a quiz and without an account", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByText("Số liệu bên dưới chỉ lưu trên trình duyệt này.")).toBeVisible();
  // No quiz: the page's built-in sample plan (2100 ml goal) and local demo value (750 ml).
  await expect(waterLine(page)).toHaveText(waterText(750, 2100));
  await page.getByRole("button", ADD_WATER_BUTTON).click();
  // 750 + 250 = 1000, shown with the thousands separator as "1.000 / 2.100 ml".
  await expect(waterLine(page)).toHaveText(waterText(1000, 2100));
  expect(await readWater(page)).toEqual({ drunkMl: 1000, goalMl: 2100 });
  await expectNoHorizontalScroll(page);
});
