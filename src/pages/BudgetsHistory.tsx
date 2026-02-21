import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Budget } from "@/lib/api";
import { api } from "@/lib/api";
import { History, Trash2, Eye, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

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
        console.error('Erro ao carregar cálculos:', e);
      }
    };

    load();
  }, [user]);

  const handleDelete = async (budgetId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cálculo?")) return;
    try {
      await api.deleteBudget(budgetId);
      setBudgets(budgets.filter(b => b.id !== budgetId));
    } catch (e) {
      alert('Erro ao excluir cálculo');
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Você precisa estar logado para ver seus cálculos</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-calcularq-blue hover:bg-[#002366] text-white">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
                <History className="w-6 h-6 text-calcularq-blue" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-calcularq-blue">
                  Meus Cálculos
                </h1>
                <p className="text-slate-600">
                  Acesse aqui os cálculos que você salvou no sistema.
                </p>
              </div>
            </div>
            <Link to={createPageUrl("Calculator")}>
              <Button className="bg-calcularq-blue hover:bg-[#002366] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Cálculo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Budgets List */}
        {budgets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
          >
            <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Nenhum cálculo salvo ainda
            </h3>
            <Link to={createPageUrl("Calculator")}>
              <Button className="bg-calcularq-blue hover:bg-[#002366] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Cálculo
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget, index) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-calcularq-blue text-lg mb-1">
                      {budget.name || "Cálculo sem nome"}
                    </h3>
                    {budget.clientName && (
                      <p className="text-sm text-slate-600">Cliente: {budget.clientName}</p>
                    )}
                    {budget.projectName && (
                      <p className="text-sm text-slate-600">Projeto: {budget.projectName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Preço Final:</span>
                    <span className="font-bold text-calcularq-blue text-lg">
                      R$ {budget.data.results.finalSalePrice.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Complexidade:</span>
                    <span className="font-semibold text-slate-700">
                      {budget.data.results.globalComplexity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Horas:</span>
                    <span className="font-semibold text-slate-700">
                      {budget.data.estimatedHours}h
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(budget.updatedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <Link to={`${createPageUrl("Calculator")}?budget=${budget.id}`}>
                  <Button className="w-full bg-calcularq-blue hover:bg-[#002366] text-white">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
