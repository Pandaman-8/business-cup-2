import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const el = dialog.current!;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    el.showModal();
    return () => {
      el.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected && !trigger.closest("[hidden]")) trigger.focus();
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [title]);
  return (
    <dialog
      ref={dialog}
      className="plan-dialog"
      aria-labelledby="plan-dialog-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 ref={heading} tabIndex={-1} id="plan-dialog-title">
          {title}
        </h2>
        <button type="button" className="text-button" onClick={onClose}>
          Close
        </button>
      </div>
      {children}
    </dialog>
  );
}
