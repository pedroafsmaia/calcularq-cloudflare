import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Budget, api } from "@/lib/api";
import { History, Trash2, Eye, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import SectionHeader from "@/components/calculator/SectionHeader";

export default function BudgetsHistory() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const resp = await api.listBudgets();
        setBudgets(resp.budgets);
      } catch (e) {
        console.error("Erro ao carregar calculos:", e);
      }
    };

    load();
  }, [user]);

  const handleDelete = async (budgetId: string) => {
    if (!confirm("Tem certeza que deseja excluir este calculo?")) return;
    try {
      await api.deleteBudget(budgetId);
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    } catch (e) {
      alert("Erro ao excluir calculo");
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Voce precisa estar logado para ver seus calculos</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-calcularq-blue hover:bg-[#002366] text-white">Fazer login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeader
              compact
              icon={<History className="w-5 h-5 text-calcularq-blue" />}
              title="Meus Cálculos"
              description="Acesse aqui os cálculos que você salvou no sistema."
              className="mb-0"
            />

            <Link to={createPageUrl("Calculator")} className="w-full sm:w-auto">
              <Button className="bg-calcularq-blue hover:bg-[#002366] text-white w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Cálculo
              </Button>
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <span className="text-slate-600">
              {budgets.length === 0
                ? "Nenhum calculo salvo"
                : `${budgets.length} calculo${budgets.length > 1 ? "s" : ""} salvo${budgets.length > 1 ? "s" : ""}`}
            </span>
            {budgets.length > 0 ? (
              <span className="hidden sm:inline text-slate-500">
                Abra um calculo salvo para continuar de onde parou.
              </span>
            ) : null}
          </div>
        </motion.div>

        {budgets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm min-h-[280px] flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-calcularq-blue/5 border border-calcularq-blue/10 flex items-center justify-center mb-5">
              <History className="w-8 h-8 text-calcularq-blue/35" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhum cálculo salvo ainda</h3>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-[44ch] mx-auto mb-5">
              Quando você salvar um cálculo, ele aparecerá aqui com preço final, complexidade e horas estimadas.
            </p>
            <Link to={createPageUrl("Calculator")}>
              <Button className="bg-calcularq-blue hover:bg-[#002366] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro cálculo
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 content-start">
            {budgets.map((budget, index) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-calcularq-blue text-lg mb-1 truncate">
                      {budget.name || "Cálculo sem nome"}
                    </h3>
                    {budget.clientName ? (
                      <p className="text-sm text-slate-600 truncate">Cliente: {budget.clientName}</p>
                    ) : null}
                    {budget.projectName ? (
                      <p className="text-sm text-slate-600 truncate">Projeto: {budget.projectName}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    aria-label="Excluir cálculo"
                    title="Excluir cálculo"
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
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Complexidade</div>
                    <div className="mt-0.5 font-semibold text-slate-800">{budget.data.results.globalComplexity}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Horas</div>
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
                  <Link to={`${createPageUrl("Calculator")}?budget=${budget.id}`}>
                    <Button className="w-full bg-calcularq-blue hover:bg-[#002366] text-white">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalhes
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
