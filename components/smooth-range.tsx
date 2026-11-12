"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

type SmoothRangeProps = {
  min: number | string;
  max: number | string;
  step?: number | string;
  value: number;
  onValueChange: (value: number) => void;
  /** Value restored by double-clicking (or double-tapping) the thumb. */
  defaultValue?: number;
};

/** The thumb is 22px wide, so its center travels from 11px to (width - 11px). */
const THUMB = 22;
/** How close (px) a press must land to the thumb, and to the previous press, to count as a double press on it. */
const NEAR = 18;
const DOUBLE_PRESS_MS = 350;
const RESET_MS = 320;

export function SmoothRange({ min, max, step = 1, value, onValueChange, defaultValue }: SmoothRangeProps) {
  const [draft, setDraft] = useState<number | null>(null);
  const dragging = useRef(false);
  const lastPress = useRef<{ time: number; x: number; onThumb: boolean } | null>(null);
  const reset = useRef<number | null>(null);
  const lower = Number(min);
  const upper = Number(max);
  const increment = Number(step);
  const current = draft ?? value;
  const fraction = upper === lower ? 0 : (current - lower) / (upper - lower);
  const style = { "--range-progress": `calc(${fraction * 100}% + ${11 - 22 * fraction}px)` } as CSSProperties;

  useEffect(() => () => { if (reset.current !== null) cancelAnimationFrame(reset.current); }, []);

  function snap(raw: number) {
    const rounded = lower + Math.round((raw - lower) / increment) * increment;
    return Number(Math.min(upper, Math.max(lower, rounded)).toFixed(6));
  }

  function finishDrag() {
    if (reset.current !== null) return;
    dragging.current = false;
    setDraft(null);
  }

  /** Glides the thumb from its current value to the default, reporting snapped values along the way. */
  function restoreDefault(from: number) {
    const target = snap(defaultValue!);
    dragging.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDraft(null); onValueChange(target); return; }
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / RESET_MS);
      const eased = 1 - (1 - t) ** 3;
      const next = from + (target - from) * eased;
      setDraft(next);
      onValueChange(snap(next));
      if (t < 1) { reset.current = requestAnimationFrame(frame); return; }
      reset.current = null;
      setDraft(null);
      onValueChange(target);
    };
    if (reset.current !== null) cancelAnimationFrame(reset.current);
    reset.current = requestAnimationFrame(frame);
  }

  function press(event: PointerEvent<HTMLInputElement>) {
    const now = performance.now();
    const rect = event.currentTarget.getBoundingClientRect();
    const thumbX = rect.left + THUMB / 2 + fraction * (rect.width - THUMB);
    const onThumb = Math.abs(event.clientX - thumbX) < NEAR;
    const previous = lastPress.current;
    lastPress.current = { time: now, x: event.clientX, onThumb };
    // Both presses must land on the thumb: a double click elsewhere on the track only moves it there.
    const doublePress = previous && previous.onThumb && onThumb && now - previous.time < DOUBLE_PRESS_MS && Math.abs(event.clientX - previous.x) < NEAR;
    if (defaultValue !== undefined && doublePress) {
      lastPress.current = null;
      if (snap(defaultValue) !== snap(current)) restoreDefault(current);
      return;
    }
    if (reset.current !== null) { cancelAnimationFrame(reset.current); reset.current = null; }
    dragging.current = true;
    setDraft(Number(event.currentTarget.value));
  }

  return <input type="range" min={min} max={max} step={draft === null ? step : "any"} value={current} style={style}
    onPointerDown={press}
    onPointerUp={finishDrag} onPointerCancel={finishDrag} onBlur={finishDrag}
    onChange={event => {
      // While the thumb glides back to its default, the press that triggered it must not move it.
      if (reset.current !== null) return;
      const raw = Number(event.currentTarget.value);
      if (dragging.current) setDraft(raw);
      onValueChange(snap(raw));
    }} />;
}
