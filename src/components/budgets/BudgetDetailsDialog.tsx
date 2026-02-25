import { History } from "lucide-react";
import type { Budget } from "@/lib/api";
import AppDialog from "@/components/ui/AppDialog";
import SectionHeader from "@/components/calculator/SectionHeader";
import { Button } from "@/components/ui/button";

type DetailPreview = {
  totalVariableExpenses: number;
  discountPercent: number;
  discountAmount: number;
  cubPercentage: number | null;
  pricePerSqm: number | null;
  profit: number | null;
};

type Props = {
  open: boolean;
  selectedBudget: Budget | null;
  detailName: string;
  detailClientName: string;
  detailDescription: string;
  detailDirty: boolean;
  isSavingDetails: boolean;
  detailPreview: DetailPreview | null;
  onOpenChange: (open: boolean) => void;
  onDetailNameChange: (value: string) => void;
  onDetailClientNameChange: (value: string) => void;
  onDetailDescriptionChange: (value: string) => void;
  onOpenCalculator: () => void;
  onCancel: () => void;
  onSave: () => void;
};

export default function BudgetDetailsDialog({
  open,
  selectedBudget,
  detailName,
  detailClientName,
  detailDescription,
  detailDirty,
  isSavingDetails,
  detailPreview,
  onOpenChange,
  onDetailNameChange,
  onDetailClientNameChange,
  onDetailDescriptionChange,
  onOpenCalculator,
  onCancel,
  onSave,
}: Props) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Detalhes do cálculo"
      description="Edite as informações salvas e consulte um resumo dos resultados."
      maxWidthClassName="max-w-3xl"
      scrollBehavior="mobile-inner"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            className="bg-calcularq-blue hover:bg-[#002366] text-white"
            onClick={onOpenCalculator}
            disabled={!selectedBudget}
          >
            Abrir na calculadora
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-calcularq-blue hover:bg-[#002366] text-white"
              onClick={onSave}
              disabled={!selectedBudget || !detailName.trim() || isSavingDetails || !detailDirty}
            >
              {isSavingDetails ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      }
    >
      {selectedBudget ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="space-y-4 lg:flex lg:h-full lg:flex-col">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do cálculo *</label>
              <input
                type="text"
                value={detailName}
                onChange={(e) => onDetailNameChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do cliente (opcional)</label>
              <input
                type="text"
                value={detailClientName}
                onChange={(e) => onDetailClientNameChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue/20"
              />
            </div>

            <div className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Descrição (opcional)</label>
              <textarea
                rows={4}
                value={detailDescription}
                onChange={(e) => onDetailDescriptionChange(e.target.value)}
                className="w-full min-h-[7rem] rounded-lg border border-slate-300 px-3 py-2.5 resize-none lg:min-h-0 lg:flex-1 focus:outline-none focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue/20"
              />
            </div>

            {selectedBudget.projectName ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Projeto</p>
                <p className="mt-1 text-sm text-slate-700">{selectedBudget.projectName}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader
              compact
              className="mb-0"
              icon={<History className="h-5 w-5 text-calcularq-blue" />}
              title="Resumo dos resultados"
              description="Visualização rápida do cálculo salvo."
              titleClassName="text-lg"
              descriptionClassName="text-sm"
            />

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/5 px-4 py-3">
                <p className="text-xs font-semibold text-calcularq-blue/80 mb-1">Preço de Venda Final</p>
                <p className="text-2xl font-bold text-calcularq-blue">
                  R$ {selectedBudget.data.results.finalSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Hora técnica mínima</span>
                  <span className="font-semibold text-slate-800">
                    R$ {selectedBudget.data.minHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Complexidade global</span>
                  <span className="font-semibold text-slate-800">{selectedBudget.data.results.globalComplexity}x</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Hora ajustada</span>
                  <span className="font-semibold text-slate-800">
                    R$ {selectedBudget.data.results.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Preço do projeto</span>
                  <span className="font-semibold text-slate-800">
                    R$ {selectedBudget.data.results.projectPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Horas estimadas</span>
                  <span className="font-semibold text-slate-800">{selectedBudget.data.estimatedHours}h</span>
                </div>
                {detailPreview && detailPreview.totalVariableExpenses > 0 ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Despesas variáveis</span>
                    <span className="font-semibold text-slate-800">
                      R$ {detailPreview.totalVariableExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : null}
                {detailPreview && detailPreview.discountAmount > 0 ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Desconto ({detailPreview.discountPercent}%)</span>
                    <span className="font-semibold text-red-500">
                      - R$ {detailPreview.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : null}
                {detailPreview && detailPreview.cubPercentage !== null ? (
                  <div className="flex items-center justify-between gap-3 text-sm border-t border-slate-100 pt-2">
                    <span className="text-slate-500">% do valor da obra</span>
                    <span className="font-semibold text-slate-800">{detailPreview.cubPercentage.toFixed(1)}%</span>
                  </div>
                ) : null}
                {detailPreview && detailPreview.pricePerSqm !== null ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Preço/m²</span>
                    <span className="font-semibold text-slate-800">
                      R$ {detailPreview.pricePerSqm.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : null}
                {detailPreview && detailPreview.profit !== null ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Lucro estimado</span>
                    <span className={`font-semibold ${detailPreview.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                      R$ {detailPreview.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppDialog>
  );
}
