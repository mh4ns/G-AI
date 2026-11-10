import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll } from "./helpers";
import { URLS } from "./urls";

const HUB_HOME = `${URLS.hub}/`;

// Every product's logo links back to the hub (hubUrl() in packages/ui).
const LOGO_PAGES = [
  { name: "site home", url: `${URLS.site}/` },
  { name: "app login", url: `${URLS.app}/login` },
  { name: "app today", url: `${URLS.app}/today` },
  { name: "app prediction", url: `${URLS.app}/prediction` },
];

for (const { name, url } of LOGO_PAGES) {
  test(`logo on ${name} returns to the hub`, async ({ page }) => {
    await page.goto(url);
    const logo = page.locator(`a[href="${HUB_HOME}"]`).first();
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL(HUB_HOME);
    await expect(page.getByRole("region", { name: "Sản phẩm G-AI" })).toBeVisible();
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
