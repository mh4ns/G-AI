import { expect, test } from "@playwright/test";
import { completeQuiz, expectNoHorizontalScroll } from "./helpers";
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
  await expect(page.getByText(`/ ${plan.recommendedWaterMl} ml`)).toBeVisible();
});

test("guest Today works without a quiz and without an account", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByText("Số liệu bên dưới chỉ lưu trên trình duyệt này.")).toBeVisible();
  const water = page.getByText(/^\d+ \/ \d+ ml$/);
  const before = Number((await water.innerText()).split(" ")[0]);
  await page.getByRole("button", { name: "+250ml" }).click();
  await expect(water).toHaveText(new RegExp(`^${before + 250} / `));
  await expectNoHorizontalScroll(page);
});
