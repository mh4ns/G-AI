import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll } from "./helpers";
import { URLS } from "./urls";

const SITE_HOME = `${URLS.site}/`;
const LOGO = "G-AI – trang chủ";
const BACK = "Quay lại trang trước";

// The logo always leads to the brand site's home page (homeUrl() in packages/ui).
const LOGO_PAGES = [
  { name: "site home", url: SITE_HOME },
  { name: "hub", url: `${URLS.hub}/` },
  { name: "app quiz", url: `${URLS.app}/quiz` },
  { name: "app login", url: `${URLS.app}/login` },
  { name: "app today", url: `${URLS.app}/today` },
  { name: "app prediction", url: `${URLS.app}/prediction` },
];

for (const { name, url } of LOGO_PAGES) {
  test(`logo on ${name} goes to the brand site home`, async ({ page }) => {
    await page.goto(url);
    await page.getByRole("link", { name: LOGO }).first().click();
    await expect(page).toHaveURL(SITE_HOME);
    await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
  });
}

// The back button returns to the page the visitor came from, even on another site.
const BACK_FROM_SITE = [
  { name: "prediction", link: "Bản sao số (Digital Twin)", arrives: `${URLS.app}/prediction` },
  { name: "login", link: "Đăng nhập", arrives: `${URLS.app}/login` },
  { name: "quiz", link: "Bắt đầu khảo sát", arrives: `${URLS.app}/quiz` },
];

for (const { name, link, arrives } of BACK_FROM_SITE) {
  test(`back on app ${name} returns to the brand site it was opened from`, async ({ page }) => {
    await page.goto(SITE_HOME);
    await page.getByRole("banner").getByRole("link", { name: link, exact: true }).click();
    await expect(page).toHaveURL(arrives);
    await page.getByRole("link", { name: BACK }).click();
    await expect(page).toHaveURL(SITE_HOME);
  });
}

test("back on prediction returns to Today when it was opened from Today", async ({ page }) => {
  await page.goto(`${URLS.app}/today`);
  await page.locator('a[href="/prediction"]').first().click();
  await expect(page).toHaveURL(`${URLS.app}/prediction`);
  await page.getByRole("link", { name: BACK }).click();
  await expect(page).toHaveURL(`${URLS.app}/today`);
});

// Opened directly (bookmark, new tab): nothing is behind the page, so use the fixed fallback.
const BACK_FALLBACKS = [
  { name: "prediction", url: `${URLS.app}/prediction`, fallback: `${URLS.app}/today` },
  { name: "login", url: `${URLS.app}/login`, fallback: SITE_HOME },
  { name: "quiz", url: `${URLS.app}/quiz`, fallback: SITE_HOME },
];

for (const { name, url, fallback } of BACK_FALLBACKS) {
  test(`back on app ${name} opened directly goes to its fallback`, async ({ page }) => {
    await page.goto(url);
    await page.getByRole("link", { name: BACK }).click();
    await expect(page).toHaveURL(fallback);
  });
}

test("hub links to both product sites", async ({ page }) => {
  await page.goto(URLS.hub);
  const products = page.getByRole("region", { name: "Sản phẩm G-AI" });
  await expect(products.locator(`a[href="${URLS.app}/quiz"]`)).toHaveCount(1);
  await expect(products.locator(`a[href="${URLS.site}/"]`)).toHaveCount(1);
});

test.describe("phone width (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  const PAGES = [
    `${URLS.hub}/`,
    `${URLS.site}/`,
    `${URLS.app}/quiz`,
    `${URLS.app}/login`,
    `${URLS.app}/today`,
    `${URLS.app}/prediction`,
  ];

  for (const url of PAGES) {
    test(`no horizontal scroll on ${url}`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState("load");
      await expectNoHorizontalScroll(page);
    });
  }
});
