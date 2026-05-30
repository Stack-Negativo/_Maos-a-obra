const THEME_STORAGE_KEY = "maos_a_obra_theme";

function getPreferredTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initializeTheme() {
  applyTheme(getPreferredTheme());
}

export function toggleTheme() {
  const currentTheme =
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(currentTheme === "dark" ? "light" : "dark");
}
