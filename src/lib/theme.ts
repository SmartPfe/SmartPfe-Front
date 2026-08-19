import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark";

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    localStorage.theme = "dark";
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.theme = "light";
  }
  window.dispatchEvent(new CustomEvent("theme-changed", { detail: theme }));
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    // Initial sync
    const current = getInitialTheme();
    setThemeState(current);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail);
      } else {
        setThemeState(getInitialTheme());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme") {
        setThemeState(getInitialTheme());
      }
    };

    window.addEventListener("theme-changed", handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("theme-changed", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
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
