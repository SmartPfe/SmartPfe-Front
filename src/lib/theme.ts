import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark";

function savedTheme(): ThemeMode | null {
  try {
    const value = window.localStorage.getItem("theme");
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return savedTheme() ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function renderTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

// Apply the preference before React renders, without turning an OS preference
// into a saved user choice.
export function initializeTheme(): ThemeMode {
  const theme = getInitialTheme();
  if (typeof window !== "undefined") renderTheme(theme);
  return theme;
}

export function applyTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;
  renderTheme(theme);
  try { window.localStorage.setItem("theme", theme); } catch { /* Theme still works when storage is unavailable. */ }
  window.dispatchEvent(new window.CustomEvent("theme-changed", { detail: theme }));
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    // Initial sync
    const current = initializeTheme();
    setThemeState(current);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail === "dark" || customEvent.detail === "light") {
        renderTheme(customEvent.detail);
        setThemeState(customEvent.detail);
      } else {
        setThemeState(initializeTheme());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme" || e.key === null) {
        setThemeState(initializeTheme());
      }
    };

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemTheme = () => {
      if (!savedTheme()) setThemeState(initializeTheme());
    };

    window.addEventListener("theme-changed", handleThemeChange);
    window.addEventListener("storage", handleStorage);
    systemTheme.addEventListener("change", handleSystemTheme);
    return () => {
      window.removeEventListener("theme-changed", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
      systemTheme.removeEventListener("change", handleSystemTheme);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setThemeState(nextTheme);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    applyTheme(newTheme);
    setThemeState(newTheme);
  }, []);

  return {
    theme,
    isDarkMode: theme === "dark",
    toggleTheme,
    setTheme,
  };
}
