import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";

export function ManualCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 ${className}`.trim()}>
      {children}
    </section>
  );
}

export function NoteBox({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "amber" | "slate" }) {
  if (tone === "slate") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700 sm:px-4 sm:py-3 sm:text-base">
        {children}
      </div>
    );
  }

  const Icon = tone === "amber" ? AlertTriangle : AlertCircle;
  const containerClass =
    tone === "amber"
      ? "border-amber-500 bg-amber-50"
      : "border-blue-500 bg-blue-50";
  const iconClass = tone === "amber" ? "text-amber-600" : "text-blue-600";
  const textClass =
    tone === "amber"
      ? "text-amber-800 [&_strong]:text-amber-900"
      : "text-blue-700 [&_strong]:text-blue-900";

  return (
    <div className={`flex items-start gap-3 rounded-xl border-l-4 px-4 py-3 ${containerClass}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
      <div className={`text-sm leading-relaxed sm:text-base ${textClass}`}>{children}</div>
    </div>
  );
}
