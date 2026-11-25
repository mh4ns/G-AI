export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "g_ai_theme";
export const THEME_MANUAL_STORAGE_KEY = "g_ai_theme_manual";
export const DEFAULT_THEME: ThemeMode = "light";

export type ThemeStorage = Pick<Storage, "getItem" | "setItem"> &
  Partial<Pick<Storage, "removeItem">>;

export type MatchMediaFn = (query: string) => { matches: boolean };

export interface ThemeRootElement {
  setAttribute(name: string, value: string): void;
  classList?: {
    toggle(token: string, force?: boolean): boolean;
  };
}

export interface ThemeEnvironment {
  storage?: ThemeStorage | null;
  matchMedia?: MatchMediaFn | null;
  rootElement?: ThemeRootElement | null;
  defaultTheme?: ThemeMode;
  respectSystemPreference?: boolean;
  toggleDarkClass?: boolean;
}

function getDefaultStorage(): ThemeStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function getDefaultMatchMedia(): MatchMediaFn | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return (query: string) => window.matchMedia(query);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function readStoredTheme(
  env?: Pick<ThemeEnvironment, "storage" | "matchMedia" | "defaultTheme" | "respectSystemPreference">
): ThemeMode {
  const storage = env && "storage" in env ? (env.storage ?? null) : getDefaultStorage();

  if (storage) {
    try {
      const manual = storage.getItem(THEME_MANUAL_STORAGE_KEY);
      if (manual === "true") {
        const saved = storage.getItem(THEME_STORAGE_KEY);
        if (isThemeMode(saved)) {
          return saved;
        }
      }
    } catch {
      // Storage may throw in private browsing or sandboxed contexts.
    }
  }

  if (env?.respectSystemPreference === true) {
    const matchMedia =
      env && "matchMedia" in env ? (env.matchMedia ?? null) : getDefaultMatchMedia();
    if (matchMedia) {
      try {
        return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } catch {
        // Ignore matchMedia failures.
      }
    }
  }

  return env?.defaultTheme ?? DEFAULT_THEME;
}

export function applyThemeToElement(
  theme: ThemeMode,
  element?: ThemeRootElement | null,
  options?: { toggleDarkClass?: boolean }
): void {
  if (element === null) return;
  const target =
    element !== undefined
      ? element
      : typeof document !== "undefined"
        ? document.documentElement
        : null;

  if (!target) return;

  target.setAttribute("data-theme", theme);
  if (options?.toggleDarkClass) {
    target.classList?.toggle("dark", theme === "dark");
  }
}

export function writeStoredTheme(
  theme: ThemeMode,
  env?: Pick<ThemeEnvironment, "storage" | "rootElement" | "toggleDarkClass">
): void {
  const storage = env && "storage" in env ? (env.storage ?? null) : getDefaultStorage();

  if (storage) {
    try {
      storage.setItem(THEME_STORAGE_KEY, theme);
      storage.setItem(THEME_MANUAL_STORAGE_KEY, "true");
    } catch {
      // Ignore storage write errors (e.g. quota exceeded or private mode).
    }
  }

  if (env?.rootElement) {
    applyThemeToElement(theme, env.rootElement, {
      toggleDarkClass: env.toggleDarkClass,
    });
  }
}

export function toggleStoredTheme(
  current: ThemeMode,
  env?: Pick<ThemeEnvironment, "storage" | "rootElement" | "toggleDarkClass">
): ThemeMode {
  const next: ThemeMode = current === "dark" ? "light" : "dark";
  writeStoredTheme(next, env);
  return next;
}
