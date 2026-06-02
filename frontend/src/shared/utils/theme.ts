const THEME_STORAGE_KEY = "maos_a_obra_theme";
const LEGACY_THEME_STORAGE_KEY = "theme";

function getPreferredTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (legacyTheme === "light" || legacyTheme === "dark") {
    return legacyTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export type AppTheme = "light" | "dark";

function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme);
}

export function initializeTheme() {
  applyTheme(getPreferredTheme());
}

export function getCurrentTheme(): AppTheme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function toggleTheme() {
  const currentTheme =
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  return nextTheme;
}
