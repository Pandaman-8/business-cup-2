import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
// Errors reveal the affected group, but resolving an error must not hide a focused input.
export default function Disclosure({
  children,
  className,
  expanded = false,
  attention = false,
  defaultOpen = false,
}: {
  children: ReactNode;
  className?: string;
  expanded?: boolean;
  attention?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(expanded || attention || defaultOpen);
  const lastMode = useRef(expanded);
  useEffect(() => {
    if (lastMode.current !== expanded) {
      lastMode.current = expanded;
      setOpen(expanded);
    }
  }, [expanded]);
  useEffect(() => {
    if (attention) setOpen(true);
  }, [attention]);
  return (
    <details
      className={className}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      {children}
    </details>
  );
}
