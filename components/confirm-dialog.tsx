"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

/** A modal confirmation built on the native <dialog>: it traps focus, closes on Escape, and blocks the page behind it. */
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);

  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`}
    onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="confirm-dialog-content">
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-body`}>{body}</p>
      <div className="confirm-dialog-actions">
        <button type="button" autoFocus onClick={onClose}>{cancelLabel}</button>
        <button type="button" className="confirm-dialog-danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </div>
    </div>
  </dialog>;
}
