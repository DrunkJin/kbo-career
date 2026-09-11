import { useEffect, useRef, type ReactNode } from "react";

/** 모달이 열리면 배경 스크롤과 키보드 포커스가 게임 화면으로 새지 않게 합니다. */
export function Modal({ children, label, onClose }: { children: ReactNode; label: string; onClose?: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && close.current && !root.current?.querySelector('[role="tooltip"]')) { e.preventDefault(); e.stopPropagation(); close.current(); }
      if (e.key !== "Tab") return;
      const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, [tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0);
      const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === root.current)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey, true);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return <div ref={root} className="modal" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>{children}</div>;
}
