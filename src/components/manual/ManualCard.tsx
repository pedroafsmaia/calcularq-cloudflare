import type { ReactNode } from "react";

export function ManualCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 ${className}`.trim()}>
      {children}
    </section>
  );
}

export function NoteBox({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "amber" | "slate" }) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "slate"
        ? "border-slate-200 bg-slate-50 text-slate-700"
        : "border-blue-200 bg-blue-50/70 text-blue-800";

  return <div className={`rounded-xl border px-4 py-3 leading-relaxed ${toneClass}`}>{children}</div>;
}
