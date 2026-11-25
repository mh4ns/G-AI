import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_THEME,
  THEME_MANUAL_STORAGE_KEY,
  THEME_STORAGE_KEY,
  applyThemeToElement,
  isThemeMode,
  readStoredTheme,
  toggleStoredTheme,
  writeStoredTheme,
  type ThemeRootElement,
  type ThemeStorage,
} from "../theme";

function createMemoryStorage(initial: Record<string, string> = {}): ThemeStorage & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...initial };
  return {
    store,
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = value;
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

function createFakeElement() {
  const attrs: Record<string, string> = {};
  const classes = new Set<string>();
  const element: ThemeRootElement = {
    setAttribute(name, value) {
      attrs[name] = value;
    },
    classList: {
      toggle(token, force) {
        const shouldAdd = force ?? !classes.has(token);
        if (shouldAdd) classes.add(token);
        else classes.delete(token);
        return shouldAdd;
      },
    },
  };
  return { element, attrs, classes };
}

describe("@g-ai/ui/theme", () => {
  it("is SSR-safe when storage, matchMedia, and rootElement are null", () => {
    assert.equal(
      readStoredTheme({ storage: null, matchMedia: null }),
      DEFAULT_THEME
    );
    assert.doesNotThrow(() => {
      writeStoredTheme("dark", { storage: null, rootElement: null });
    });
    const next = toggleStoredTheme("light", { storage: null, rootElement: null });
    assert.equal(next, "dark");
    assert.doesNotThrow(() => applyThemeToElement("dark", null));
  });

  it("degrades safely when Storage throws on read or write", () => {
    const throwingStorage: ThemeStorage = {
      getItem() {
        throw new Error("SecurityError");
      },
      setItem() {
        throw new Error("QuotaExceededError");
      },
    };

    assert.equal(readStoredTheme({ storage: throwingStorage }), "light");
    assert.doesNotThrow(() => writeStoredTheme("dark", { storage: throwingStorage }));
    assert.equal(toggleStoredTheme("dark", { storage: throwingStorage }), "light");
  });

  it("honors stored theme only when manual flag is 'true' and rejects invalid values", () => {
    const withoutManual = createMemoryStorage({ [THEME_STORAGE_KEY]: "dark" });
    assert.equal(readStoredTheme({ storage: withoutManual }), "light");

    const invalidSaved = createMemoryStorage({
      [THEME_STORAGE_KEY]: "sepia",
      [THEME_MANUAL_STORAGE_KEY]: "true",
    });
    assert.equal(readStoredTheme({ storage: invalidSaved }), "light");
    assert.equal(isThemeMode("dark"), true);
    assert.equal(isThemeMode("sepia"), false);

    const validSaved = createMemoryStorage({
      [THEME_STORAGE_KEY]: "dark",
      [THEME_MANUAL_STORAGE_KEY]: "true",
    });
    assert.equal(readStoredTheme({ storage: validSaved }), "dark");
  });

  it("respects injected matchMedia only when respectSystemPreference is true and manual choice is absent", () => {
    const storage = createMemoryStorage();
    const darkMedia = () => ({ matches: true });

    assert.equal(readStoredTheme({ storage, matchMedia: darkMedia }), "light");
    assert.equal(
      readStoredTheme({ storage, matchMedia: darkMedia, respectSystemPreference: true }),
      "dark"
    );

    writeStoredTheme("light", { storage });
    assert.equal(storage.store[THEME_STORAGE_KEY], "light");
    assert.equal(storage.store[THEME_MANUAL_STORAGE_KEY], "true");
    assert.equal(
      readStoredTheme({ storage, matchMedia: darkMedia, respectSystemPreference: true }),
      "light"
    );
  });

  it("updates data-theme attribute and optional dark class via applyThemeToElement and toggleStoredTheme", () => {
    const storage = createMemoryStorage();
    const { element, attrs, classes } = createFakeElement();

    const first = toggleStoredTheme("light", {
      storage,
      rootElement: element,
      toggleDarkClass: true,
    });
    assert.equal(first, "dark");
    assert.equal(storage.store[THEME_STORAGE_KEY], "dark");
    assert.equal(storage.store[THEME_MANUAL_STORAGE_KEY], "true");
    assert.equal(attrs["data-theme"], "dark");
    assert.equal(classes.has("dark"), true);

    const second = toggleStoredTheme(first, {
      storage,
      rootElement: element,
      toggleDarkClass: true,
    });
    assert.equal(second, "light");
    assert.equal(attrs["data-theme"], "light");
    assert.equal(classes.has("dark"), false);
  });
});
