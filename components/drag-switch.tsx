"use client";

import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { snapSegment } from "@/lib/switch-snap";

const dropStretch = (position: number) => 1 + .22 * Math.sin(Math.PI * (position % 1));
const dragTravel = (element: HTMLElement) => Number.parseFloat(getComputedStyle(element).getPropertyValue("--drag-travel")) || element.clientWidth / 2;

export function useDragSwitch<T extends HTMLElement>(checked: boolean, onChange: (checked: boolean) => void) {
  const pointer = useRef<{ id: number; startX: number; startValue: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [progress, setProgress] = useState<number | null>(null);

  function onPointerDown(event: PointerEvent<T>) {
    if (event.button !== 0 || !event.isPrimary) return;
    pointer.current = { id: event.pointerId, startX: event.clientX, startValue: checked ? 1 : 0, dragging: false };
  }

  function onPointerMove(event: PointerEvent<T>) {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    const delta = event.clientX - current.startX;
    if (!current.dragging && Math.abs(delta) < 4) return;
    if (!current.dragging) {
      current.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const travel = dragTravel(event.currentTarget);
    setProgress(Math.max(0, Math.min(1, current.startValue + delta / travel)));
  }

  function onPointerUp(event: PointerEvent<T>) {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    pointer.current = null;
    if (current.dragging) {
      const value = current.startValue + (event.clientX - current.startX) / dragTravel(event.currentTarget);
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
      onChange(snapSegment(current.startValue, value - current.startValue, 2) === 1);
    }
    setProgress(null);
  }

  function onPointerCancel() { pointer.current = null; setProgress(null); }
  function onLostPointerCapture(event: PointerEvent<T>) {
    if (event.target !== event.currentTarget || pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    setProgress(null);
  }
  function onClickCapture(event: MouseEvent<T>) {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  }

  return {
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, onClickCapture,
    "data-dragging": progress !== null ? "true" : undefined,
    style: progress !== null ? { "--drag-progress": progress, "--drag-stretch": dropStretch(progress) } as CSSProperties : undefined,
  };
}

export function DragToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const drag = useDragSwitch<HTMLInputElement>(checked, onChange);
  return <input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} {...drag} />;
}

export function DraggableSegments({ className, children }: { className: string; children: ReactNode }) {
  const pointer = useRef<{ id: number; startX: number; startIndex: number; step: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [position, setPosition] = useState<number | null>(null);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(":scope > button"));
    const startIndex = buttons.findIndex(button => button.getAttribute("aria-pressed") === "true");
    if (startIndex < 0 || buttons.length < 2) return;
    const step = buttons[1].offsetLeft - buttons[0].offsetLeft;
    if (step <= 0) return;
    pointer.current = { id: event.pointerId, startX: event.clientX, startIndex, step, dragging: false };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    const delta = event.clientX - current.startX;
    if (!current.dragging && Math.abs(delta) < 4) return;
    if (!current.dragging) {
      current.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const count = event.currentTarget.querySelectorAll(":scope > button").length;
    setPosition(Math.max(0, Math.min(count - 1, current.startIndex + delta / current.step)));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    pointer.current = null;
    if (current.dragging) {
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(":scope > button"));
      const index = snapSegment(current.startIndex, (event.clientX - current.startX) / current.step, buttons.length);
      if (index !== current.startIndex) buttons[index]?.click();
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
    setPosition(null);
  }

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  }

  return <div className={className} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
    onPointerCancel={() => { pointer.current = null; setPosition(null); }} onClickCapture={onClickCapture}
    onLostPointerCapture={event => {
      if (event.target !== event.currentTarget || pointer.current?.id !== event.pointerId) return;
      pointer.current = null;
      setPosition(null);
    }}
    data-dragging={position !== null ? "true" : undefined}
    style={position !== null ? { "--drag-index": position, "--drag-stretch": dropStretch(position) } as CSSProperties : undefined}>{children}</div>;
}
