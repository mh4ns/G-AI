import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { URLS } from "./urls";

/**
 * End-to-end tests across the hub (:3002), the brand site (:3001), the coaching app (:3000)
 * and the FastAPI backend (:8000, SQLite in a temp file so every run starts empty).
 *
 * The ports match the defaults baked into `packages/ui/src/links.ts` and `apps/web/next.config.mjs`,
 * so a plain `npm run build` produces apps that link to each other and proxy to this backend.
 *
 *   npm run e2e                 build the three apps, start everything, run the tests
 *   E2E_SKIP_BUILD=1 npm run e2e   reuse existing .next builds (CI downloads them from the build jobs)
 */
const ROOT = path.resolve(__dirname, "..");
const CI = !!process.env.CI;
const skipBuild = process.env.E2E_SKIP_BUILD === "1";
const python = process.env.E2E_PYTHON || (process.platform === "win32" ? "python" : "python3");
const sqlitePath = path.join(os.tmpdir(), `g-ai-e2e-${process.pid}-${Date.now()}.db`);

function nextServer(workspace: string, url: string) {
  const start = `npm run start -w ${workspace}`;
  return {
    command: skipBuild ? start : `npm run build -w ${workspace} && ${start}`,
    cwd: ROOT,
    url,
    reuseExistingServer: !CI,
    timeout: 10 * 60_000,
    stdout: "ignore" as const,
    stderr: "pipe" as const,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  };
}

export default defineConfig({
  testDir: ".",
  outputDir: path.join(ROOT, "test-results"),
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: CI
    ? [["github"], ["html", { outputFolder: path.join(ROOT, "playwright-report"), open: "never" }]]
    : [["list"], ["html", { outputFolder: path.join(ROOT, "playwright-report"), open: "never" }]],
  use: {
    baseURL: URLS.app,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Migrations run first, exactly as in the production container.
      command: `${python} -m alembic upgrade head && ${python} -m uvicorn app.main:app --host 127.0.0.1 --port 8000`,
      cwd: path.join(ROOT, "apps/backend"),
      url: `${URLS.api}/healthz`,
      reuseExistingServer: !CI,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
      env: {
        ENVIRONMENT: "test",
        DATABASE_URL: `sqlite+aiosqlite:///${sqlitePath}`,
        AUTO_CREATE_SCHEMA: "false",
        BACKEND_CORS_ORIGINS: `${URLS.app},${URLS.site}`,
      },
    },
    nextServer("g-ai-hub", URLS.hub),
    nextServer("g-ai-site", URLS.site),
    nextServer("g-ai-web", `${URLS.app}/login`),
  ],
});
