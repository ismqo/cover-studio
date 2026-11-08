"use client";

import { useRef, useState, type CSSProperties } from "react";

type SmoothRangeProps = {
  min: number | string;
  max: number | string;
  step?: number | string;
  value: number;
  onValueChange: (value: number) => void;
};

export function SmoothRange({ min, max, step = 1, value, onValueChange }: SmoothRangeProps) {
  const [draft, setDraft] = useState<number | null>(null);
  const dragging = useRef(false);
  const lower = Number(min);
  const upper = Number(max);
  const increment = Number(step);
  const current = draft ?? value;
  const fraction = upper === lower ? 0 : (current - lower) / (upper - lower);
  const style = { "--range-progress": `calc(${fraction * 100}% + ${11 - 22 * fraction}px)` } as CSSProperties;

  function snap(raw: number) {
    const rounded = lower + Math.round((raw - lower) / increment) * increment;
    return Number(Math.min(upper, Math.max(lower, rounded)).toFixed(6));
  }

  function finishDrag() {
    dragging.current = false;
    setDraft(null);
  }

  return <input type="range" min={min} max={max} step={draft === null ? step : "any"} value={current} style={style}
    onPointerDown={event => { dragging.current = true; setDraft(Number(event.currentTarget.value)); }}
    onPointerUp={finishDrag} onPointerCancel={finishDrag} onBlur={finishDrag}
    onChange={event => {
      const raw = Number(event.currentTarget.value);
      if (dragging.current) setDraft(raw);
      onValueChange(snap(raw));
    }} />;
}
