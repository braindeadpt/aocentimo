import type { ReactNode } from "react";

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="border-l border-line pl-4 py-1">
      <p className="kicker">{label}</p>
      <p className="num text-2xl md:text-3xl mt-1 text-ink">{value}</p>
      {hint && <p className="footnote mt-1">{hint}</p>}
    </div>
  );
}
