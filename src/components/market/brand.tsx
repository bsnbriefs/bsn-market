export function SeekLogo({ className }: { className?: string }) {
  return (
    <span className={`seek-logo relative inline-block w-fit max-w-full shrink-0 self-start leading-none ${className ?? ""}`}>
      <img src="/seek-mark-base.png" alt="SEEK" className="seek-ink block h-full w-auto" />
      <img src="/seek-mark-base-light.png" alt="" aria-hidden className="seek-ink-light pointer-events-none absolute inset-0 hidden h-full w-full" />
      <img src="/seek-mark-handle.png" alt="" aria-hidden className="seek-bag pointer-events-none absolute inset-0 h-full w-full" />
    </span>
  );
}