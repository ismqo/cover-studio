"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ellipsis } from "lucide-react";
import { useI18n } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";
import { useDragSwitch } from "@/components/drag-switch";

export function NavMenu() {
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const localeDrag = useDragSwitch<HTMLDivElement>(locale === "es", value => setLocale(value ? "es" : "en"));

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (root.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const timer = window.setTimeout(() => document.addEventListener("pointerdown", onPointer), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function chooseLocale(next: Locale) {
    setLocale(next);
  }

  return (
    <div className="nav-menu" ref={root}>
      <button
        type="button"
        className="nav-menu-trigger"
        aria-label={t.nav.more}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={event => {
          event.stopPropagation();
          setOpen(value => !value);
        }}
      >
        <Ellipsis size={22} strokeWidth={2.25} />
      </button>
      {open && (
        <div className="nav-menu-panel" id={menuId} role="dialog" aria-label={t.nav.settings}>
          <div className="nav-menu-row">
            <span className="nav-menu-label" id={`${menuId}-lang`}>{t.nav.language}</span>
            <div className="locale-switch" role="radiogroup" aria-labelledby={`${menuId}-lang`} {...localeDrag}>
              <span className="locale-switch-thumb" />
              <button type="button" role="radio" aria-checked={locale === "en"} aria-label={t.nav.english} onClick={() => chooseLocale("en")}>EN</button>
              <button type="button" role="radio" aria-checked={locale === "es"} aria-label={t.nav.spanish} onClick={() => chooseLocale("es")}>ES</button>
            </div>
          </div>
          <a
            className="nav-menu-link"
            href="https://github.com/ismqo/cover-studio"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            GitHub
          </a>
        </div>
      )}
    </div>
  );
}
