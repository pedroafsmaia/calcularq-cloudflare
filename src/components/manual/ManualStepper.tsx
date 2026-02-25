type ManualStep = {
  id: string;
  short: string;
};

type Props = {
  steps: readonly ManualStep[];
  activeStepId: string;
  activeStepIndex: number;
  onStepClick: (id: string) => void;
};

export default function ManualStepper({ steps, activeStepId, activeStepIndex, onStepClick }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm backdrop-blur-sm">
      <div className="px-1">
        <div className="mx-auto flex w-full items-start justify-between gap-1 sm:gap-2">
          {steps.map((step, index) => {
            const isActive = activeStepId === step.id;
            const isCompleted = index < activeStepIndex;
            const circleLabel = step.id === "introducao" ? "I" : step.id === "encerramento" ? "C" : String(index);

            return (
              <div key={step.id} className="flex min-w-0 flex-1 items-start">
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className="group flex w-full min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-1 text-center"
                  aria-current={isActive ? "step" : undefined}
                >
                  <span
                    className={[
                      "inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors transition-shadow duration-150",
                      isCompleted
                        ? "border-calcularq-blue bg-calcularq-blue text-white shadow-md"
                        : isActive
                          ? "border-calcularq-blue bg-white text-calcularq-blue shadow-sm"
                          : "border-slate-200 bg-white text-slate-400 group-hover:border-calcularq-blue/40 group-hover:text-calcularq-blue",
                    ].join(" ")}
                  >
                    {isCompleted ? "✓" : circleLabel}
                  </span>
                  <span
                    className={[
                      "text-[11px] sm:text-xs leading-snug max-w-full",
                      isCompleted || isActive ? "text-calcularq-blue font-semibold" : "text-slate-400",
                    ].join(" ")}
                    style={{ textWrap: "balance" }}
                  >
                    {step.short}
                  </span>
                </button>

                {index < steps.length - 1 ? (
                  <span
                    className={[
                      "mt-5 mx-1 sm:mx-2 block h-[2px] flex-1 min-w-2 rounded-full",
                      index < activeStepIndex ? "bg-calcularq-blue" : "bg-slate-200",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
