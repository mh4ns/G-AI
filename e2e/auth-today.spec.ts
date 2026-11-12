import { expect, test } from "@playwright/test";
import { uniqueEmail } from "./helpers";
import { URLS } from "./urls";

const PASSWORD = "e2e-password-123";

test("register → Today shows server numbers that persist across sessions", async ({ page, browser }) => {
  const email = uniqueEmail();

  await page.goto("/today");
  await page.getByRole("link", { name: "Đăng nhập để lưu tiến trình" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Ftoday|\/login\?next=\/today/);

  await page.getByRole("button", { name: "Chưa có tài khoản? Đăng ký" }).click();
  await page.getByLabel("Họ và tên").fill("E2E Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();

  await expect(page).toHaveURL(`${URLS.app}/today`);
  // Signed in: the guest banner disappears and a new account starts at 0 ml (guests see demo values).
  await expect(page.getByRole("link", { name: "Đăng nhập để lưu tiến trình" })).toBeHidden();
  const water = page.getByText(/^\d+ \/ \d+ ml$/);
  await expect(water).toHaveText(/^0 \/ /);

  // The session cookie is first-party: /api/v1 is proxied to FastAPI by the app.
  const me = await page.request.get("/api/v1/auth/me");
  expect(me.ok()).toBeTruthy();
  expect((await me.json()).email).toBe(email);

  const added = page.waitForResponse((r) => r.url().endsWith("/api/v1/today/water") && r.ok());
  await page.getByRole("button", { name: "+250ml" }).click();
  await added;
  await expect(water).toHaveText(/^250 \/ /);

  // Stored on the server, not in the browser: a fresh browser context sees it after logging in.
  const other = await browser.newContext();
  const page2 = await other.newPage();
  await page2.goto(`${URLS.app}/login?next=/today`);
  await page2.getByLabel("Email").fill(email);
  await page2.getByLabel("Mật khẩu").fill(PASSWORD);
  await page2.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page2).toHaveURL(`${URLS.app}/today`);
  await expect(page2.getByText(/^\d+ \/ \d+ ml$/)).toHaveText(/^250 \/ /);
  await other.close();
});

test("wrong password shows an error and stays on /login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(uniqueEmail("nobody"));
  await page.getByLabel("Mật khẩu").fill("not-the-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Email hoặc mật khẩu không đúng.");
  await expect(page).toHaveURL(/\/login/);
});

test("backend health check is reachable", async ({ request }) => {
  const res = await request.get(`${URLS.api}/healthz`);
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "healthy", database: "connected" });
});
