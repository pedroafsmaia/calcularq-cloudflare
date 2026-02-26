import type { Ref } from "react";
import { ChevronDown } from "lucide-react";

type ManualStep = {
  id: string;
  short: string;
};

type Props = {
  summaryRef?: Ref<HTMLDetailsElement>;
  steps: readonly ManualStep[];
  activeStepId: string;
  activeStepIndex: number;
  activeStepShort: string;
  showsCurrentStep: boolean;
  onStepClick: (id: string) => void;
};

export default function ManualMobileSummary({
  summaryRef,
  steps,
  activeStepId,
  activeStepIndex,
  activeStepShort,
  showsCurrentStep,
  onStepClick,
}: Props) {
  return (
    <details ref={summaryRef} className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm p-3">
      <summary
        className={[
          "cursor-pointer list-none flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
          showsCurrentStep ? "bg-calcularq-blue/5 text-calcularq-blue" : "text-slate-900 hover:bg-slate-50",
        ].join(" ")}
      >
        <span className="min-w-0 truncate">{showsCurrentStep ? activeStepShort : "Sumário do manual"}</span>
        <ChevronDown className={["w-4 h-4", showsCurrentStep ? "text-calcularq-blue" : "text-slate-500"].join(" ")} />
      </summary>
      <div className="mt-3 space-y-1.5">
        {steps.map((step, index) => {
          const isActive = activeStepId === step.id;
          const isCompleted = index < activeStepIndex;
          const badgeLabel = step.id === "introducao" ? "I" : step.id === "encerramento" ? "C" : String(index);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={[
                "w-full text-left rounded-lg px-3 py-2 text-sm leading-snug transition-colors",
                isActive
                  ? "bg-calcularq-blue/5 text-calcularq-blue"
                  : isCompleted
                    ? "bg-calcularq-blue/[0.03] text-calcularq-blue"
                    : "text-slate-600 hover:bg-slate-50 hover:text-calcularq-blue",
              ].join(" ")}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={[
                    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isCompleted
                      ? "border-calcularq-blue bg-calcularq-blue text-white"
                      : isActive
                        ? "border-calcularq-blue bg-white text-calcularq-blue"
                        : "border-slate-200 bg-white text-slate-400",
                  ].join(" ")}
                >
                  {isCompleted ? "✓" : badgeLabel}
                </span>
                <span className={isActive ? "font-semibold" : undefined}>{step.short}</span>
              </span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
