import { motion } from "framer-motion";
import { Calendar, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Budget } from "@/lib/api";

type Props = {
  budget: Budget;
  index: number;
  prefersReducedMotion: boolean;
  onOpenDetails: (budget: Budget) => void;
  onRequestDelete: (id: string) => void;
};

export default function BudgetCard({
  budget,
  index,
  prefersReducedMotion,
  onOpenDetails,
  onRequestDelete,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.12 : 0.18, delay: prefersReducedMotion ? 0 : index * 0.03 }}
      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:border-slate-300 hover:shadow-sm transition-colors transition-shadow duration-150 flex flex-col cursor-pointer"
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
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-calcularq-blue text-lg mb-1 truncate">{budget.name || "Cálculo sem nome"}</h3>
          {budget.clientName ? <p className="text-sm text-slate-600 truncate">Cliente: {budget.clientName}</p> : null}
          {budget.projectName ? <p className="text-sm text-slate-600 truncate">Projeto: {budget.projectName}</p> : null}
          {budget.data?.description ? (
            <p
              className="mt-1 text-sm text-slate-500 leading-snug"
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
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
          aria-label="Excluir cálculo"
          title="Excluir cálculo"
          type="button"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/5 px-4 py-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600">Preço final</span>
          <span className="font-bold text-calcularq-blue text-lg whitespace-nowrap">
            R${" "}
            {budget.data.results.finalSalePrice.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">Complexidade</div>
          <div className="mt-0.5 font-semibold text-slate-800">{budget.data.results.globalComplexity}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">Horas</div>
          <div className="mt-0.5 font-semibold text-slate-800">{budget.data.estimatedHours}h</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <Calendar className="w-3.5 h-3.5" />
        <span>
          Atualizado em{" "}
          {new Date(budget.updatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="mt-auto">
        <Button
          type="button"
          className="w-full bg-calcularq-blue hover:bg-[#002366] text-white"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(budget);
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver detalhes
        </Button>
      </div>
    </motion.div>
  );
}
