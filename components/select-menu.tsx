"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Check } from "lucide-react";

/** Nearest ancestor that scrolls vertically, whose visible box limits where the menu can open. */
function scrollParent(element: HTMLElement) {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent;
  }
  return null;
}

/** Dropdown in the editor's own style: a field-like trigger and a glass listbox that opens below it, or above when there is no room.
 *  Keyboard: arrows open it and move through options, Enter or Space picks, Escape closes; clicking outside closes it.
 *  `optionStyle` styles each option and the shown selection, for example to set a font name in its own font. */
export function SelectMenu<T extends string>({ value, options, onChange, optionStyle, labelledBy }: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  optionStyle?: (value: T) => CSSProperties;
  labelledBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const selected = Math.max(0, options.findIndex(([option]) => option === value));

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Before the menu paints: open it upward when it would not fit below the trigger, then focus it.
  useLayoutEffect(() => {
    if (!open || !trigger.current || !list.current) return;
    const box = trigger.current.getBoundingClientRect();
    const scroller = scrollParent(root.current!)?.getBoundingClientRect();
    const top = Math.max(0, scroller?.top ?? 0), bottom = Math.min(window.innerHeight, scroller?.bottom ?? window.innerHeight);
    const height = list.current.offsetHeight + 8;
    setUp(bottom - box.bottom < height && box.top - top > bottom - box.bottom);
    list.current.focus({ preventScroll: true });
  }, [open]);

  const show = (index = selected) => { setActive(index); setOpen(true); };
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const choose = (index: number) => { onChange(options[index][0]); close(); };

  function onTriggerKey(event: KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    show();
  }

  function onListKey(event: KeyboardEvent) {
    const last = options.length - 1;
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActive(i => Math.min(last, i + 1)),
      ArrowUp: () => setActive(i => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: close,
    };
    if (event.key === "Tab") { setOpen(false); return; }
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  }

  const listId = `${id}-list`, valueId = `${id}-value`;
  return <div ref={root} className={`select-menu${open ? " open" : ""}${up ? " up" : ""}`}>
    <button ref={trigger} type="button" className="select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
      aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined} style={optionStyle?.(value)}
      onClick={() => (open ? close() : show())} onKeyDown={onTriggerKey}>
      <span id={valueId}>{options[selected]?.[1]}</span>
    </button>
    {open && <ul ref={list} id={listId} role="listbox" tabIndex={-1} className="select-menu-list" aria-labelledby={labelledBy}
      aria-activedescendant={`${id}-${active}`} onKeyDown={onListKey}>
      {options.map(([option, text], i) => <li key={option} id={`${id}-${i}`} role="option" aria-selected={option === value}
        className={i === active ? "active" : undefined} style={optionStyle?.(option)} onPointerEnter={() => setActive(i)} onClick={() => choose(i)}>
        <span>{text}</span>{option === value && <Check size={14} aria-hidden="true"/>}
      </li>)}
    </ul>}
  </div>;
}
