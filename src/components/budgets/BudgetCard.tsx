import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Eye, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Budget } from "@/lib/api";

type Props = {
  budget: Budget;
  index: number;
  prefersReducedMotion: boolean;
  showCloseProjectAction: boolean;
  isProjectClosed: boolean;
  onOpenDetails: (budget: Budget) => void;
  onOpenCloseProject: (budget: Budget) => void;
  onRequestDelete: (id: string) => void;
};

export default function BudgetCard({
  budget,
  index,
  prefersReducedMotion,
  showCloseProjectAction,
  isProjectClosed,
  onOpenDetails,
  onOpenCloseProject,
  onRequestDelete,
}: Props) {
  const finalPrice =
    typeof budget.data?.hFinal === "number" &&
    Number.isFinite(budget.data.hFinal) &&
    typeof budget.data?.results?.adjustedHourlyRate === "number"
      ? budget.data.hFinal * budget.data.results.adjustedHourlyRate
      : budget.data.results.finalSalePrice;

  const complexityScore =
    typeof budget.data?.scoreComplexidade === "number" && Number.isFinite(budget.data.scoreComplexidade)
      ? Math.round(budget.data.scoreComplexidade)
      : Math.round((budget.data.results.globalComplexity || 0) * 20);

  const hoursLabel =
    typeof budget.data?.hFinal === "number" && Number.isFinite(budget.data.hFinal)
      ? `${budget.data.hFinal}h`
      : `${budget.data.estimatedHours}h`;

  const cenarioLabel = budget.data?.cenarioEscolhido ? ` (${budget.data.cenarioEscolhido})` : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.12 : 0.18, delay: prefersReducedMotion ? 0 : index * 0.03 }}
      className="flex cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors transition-shadow duration-150 hover:border-slate-300 hover:shadow-sm sm:p-6"
      onClick={() => onOpenDetails(budget)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails(budget);
        }
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate text-lg font-bold text-calcularq-blue">{budget.name || "Cálculo sem nome"}</h3>
          {budget.clientName ? <p className="truncate text-sm text-slate-600">Cliente: {budget.clientName}</p> : null}
          {budget.projectName ? <p className="truncate text-sm text-slate-600">Projeto: {budget.projectName}</p> : null}
          {budget.data?.description ? (
            <p
              className="mt-1 text-sm leading-snug text-slate-500"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {budget.data.description}
            </p>
          ) : null}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete(budget.id);
          }}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
          aria-label="Excluir cálculo"
          title="Excluir cálculo"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/5 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600">Preço final</span>
          <span className="whitespace-nowrap text-lg font-bold text-calcularq-blue">
            R${" "}
            {finalPrice.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">Complexidade</div>
          <div className="mt-0.5 font-semibold text-slate-800">{complexityScore}/100</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">Horas</div>
          <div className="mt-0.5 font-semibold text-slate-800">
            {hoursLabel}
            {cenarioLabel}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          Atualizado em{" "}
          {new Date(budget.updatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

      {showCloseProjectAction && isProjectClosed ? (
        <Badge variant="success" className="mb-4 gap-1.5 py-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Feedback registrado em {budget.data.closedAt ? new Date(budget.data.closedAt).toLocaleDateString("pt-BR") : "data indisponível"}
        </Badge>
      ) : null}

      <div className="mt-auto flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(budget);
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver detalhes
        </Button>

        {showCloseProjectAction ? (
          <Button
            type="button"
            className="w-full bg-calcularq-blue text-white hover:bg-[#002366]"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCloseProject(budget);
            }}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Registrar feedback
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}
