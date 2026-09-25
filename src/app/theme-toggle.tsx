"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = {
  system: "🖥️ ตามระบบ",
  light: "☀️ สว่าง",
  dark: "🌙 มืด",
};

// Runs in <head> before first paint so the page never flashes the wrong theme.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

function readTheme(): Theme {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  // Keep this tab in sync when the theme is changed in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    applyTheme(readTheme());
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function ThemeToggle() {
  // null on the server: the stored theme is only known in the browser.
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null);

  useEffect(() => {
    if (theme !== "system") return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme ?? "system") + 1) % ORDER.length];
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
    listeners.forEach((l) => l());
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label="สลับธีม"
      className="fixed right-4 bottom-4 z-50 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-md transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
    >
      {theme ? LABEL[theme] : LABEL.system}
    </button>
  );
}
