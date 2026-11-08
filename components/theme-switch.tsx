"use client";

import { useLayoutEffect, useState, type KeyboardEvent } from "react";
import { useI18n } from "@/components/locale-provider";
import { useDragSwitch } from "@/components/drag-switch";

export type Theme = "light" | "dark";

const STORAGE_KEY = "cover-theme";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: Theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (!persist) return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* Private browsing can block storage; the choice still applies for this visit. */
  }
}

export function ThemeSwitch() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>("light");
  const drag = useDragSwitch<HTMLDivElement>(theme === "dark", value => choose(value ? "dark" : "light"));

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystem = () => {
      if (storedTheme()) return;
      applyTheme(media.matches ? "dark" : "light", false);
      setTheme(readTheme());
    };
    setTheme(readTheme());
    followSystem();
    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, []);

  function choose(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    choose(event.key === "ArrowLeft" ? "light" : "dark");
  }

  return (
    <div className="theme-switch" role="radiogroup" aria-label={t.nav.appearance} onKeyDown={onKeyDown} {...drag}>
      <span className="theme-switch-thumb" />
      <button type="button" role="radio" aria-checked={theme === "light"} aria-label={t.nav.light} onClick={() => choose("light")}>
        <SunIcon />
      </button>
      <button type="button" role="radio" aria-checked={theme === "dark"} aria-label={t.nav.dark} onClick={() => choose("dark")}>
        <MoonIcon />
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="2.35" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" d="M8 1.4v1.5M8 13.1v1.5M1.4 8h1.5M13.1 8h1.5M3.25 3.25l1.05 1.05M11.7 11.7l1.05 1.05M12.75 3.25l-1.05 1.05M4.3 11.7l-1.05 1.05" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M9.15 1.35a5.55 5.55 0 1 0 5.15 7.55 4.55 4.55 0 0 1-5.15-7.55z" />
    </svg>
  );
}
