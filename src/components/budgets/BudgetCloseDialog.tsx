import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Budget } from "@/lib/api";
import type { BudgetActualHoursByPhase, BudgetScopeChange } from "@/types/budget";
import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/button";

const PHASE_FIELDS: Array<{ key: keyof BudgetActualHoursByPhase; label: string }> = [
  { key: "briefing", label: "Briefing" },
  { key: "ep", label: "Estudo preliminar" },
  { key: "ap", label: "Anteprojeto" },
  { key: "ex", label: "Executivo" },
  { key: "compat", label: "Compatibilização" },
  { key: "obra", label: "Obra" },
];

type FeedbackPayload = {
  actualHoursTotal: number;
  actualHoursByPhase?: BudgetActualHoursByPhase;
  scopeChange: BudgetScopeChange;
};

type Props = {
  open: boolean;
  budget: Budget | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: FeedbackPayload) => void;
};

export default function BudgetCloseDialog({
  open,
  budget,
  isSaving,
  onOpenChange,
  onSubmit,
}: Props) {
  const [actualHoursTotal, setActualHoursTotal] = useState("");
  const [scopeChange, setScopeChange] = useState<BudgetScopeChange>("as_planned");
  const [phaseDrafts, setPhaseDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !budget) return;

    setActualHoursTotal(
      typeof budget.data.actualHoursTotal === "number" && Number.isFinite(budget.data.actualHoursTotal)
        ? String(budget.data.actualHoursTotal)
        : ""
    );

    setScopeChange(budget.data.scopeChange ?? "as_planned");

    const nextDrafts: Record<string, string> = {};
    for (const field of PHASE_FIELDS) {
      const value = budget.data.actualHoursByPhase?.[field.key];
      nextDrafts[field.key] =
        typeof value === "number" && Number.isFinite(value) && value >= 0 ? String(value) : "";
    }
    setPhaseDrafts(nextDrafts);
    setError(null);
  }, [open, budget]);

  const phaseSum = useMemo(
    () =>
      PHASE_FIELDS.reduce((sum, field) => {
        const value = Number(phaseDrafts[field.key]);
        if (!Number.isFinite(value) || value < 0) return sum;
        return sum + value;
      }, 0),
    [phaseDrafts]
  );

  const scopeOptions: Array<{ value: BudgetScopeChange; label: string }> = [
    { value: "as_planned", label: "Escopo ficou como previsto" },
    { value: "moderate", label: "Mudou moderado" },
    { value: "major", label: "Mudou muito" },
  ];

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar horas reais"
      description="Feche o projeto com as horas executadas para alimentar sua calibração pessoal da DEMO."
      maxWidthClassName="max-w-2xl"
      scrollBehavior="mobile-inner"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-calcularq-blue text-white hover:bg-[#002366]"
            disabled={isSaving || !budget}
            onClick={() => {
              const total = Number(actualHoursTotal);
              if (!Number.isFinite(total) || total <= 0) {
                setError("Informe as horas totais reais (maior que zero).");
                return;
              }

              const phasePayload: BudgetActualHoursByPhase = {};
              for (const field of PHASE_FIELDS) {
                const value = Number(phaseDrafts[field.key]);
                if (!Number.isFinite(value) || value < 0) continue;
                if (value === 0) continue;
                phasePayload[field.key] = value;
              }

              onSubmit({
                actualHoursTotal: total,
                actualHoursByPhase: Object.keys(phasePayload).length > 0 ? phasePayload : undefined,
                scopeChange,
              });
            }}
          >
            {isSaving ? "Salvando..." : "Finalizar projeto"}
          </Button>
        </div>
      }
    >
      {budget ? (
        <div className="space-y-5">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-sm font-medium text-slate-800">{budget.name}</p>
            {budget.data.closedAt ? (
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Finalizado em {new Date(budget.data.closedAt).toLocaleDateString("pt-BR")}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Horas totais reais *</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={actualHoursTotal}
              onChange={(e) => {
                setActualHoursTotal(e.target.value);
                if (error) setError(null);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-calcularq-blue focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20"
              placeholder="Ex.: 182"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Status de escopo *</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {scopeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setScopeChange(option.value)}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm font-medium text-left transition-colors",
                    scopeChange === option.value
                      ? "border-calcularq-blue bg-calcularq-blue text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Horas por etapa (opcional)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PHASE_FIELDS.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={phaseDrafts[field.key] ?? ""}
                    onChange={(e) => setPhaseDrafts((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-calcularq-blue focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20"
                    placeholder="0"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Soma das etapas preenchidas: <strong>{phaseSum.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}h</strong>
            </p>
          </div>
        </div>
      ) : null}
    </AppDialog>
  );
}
