import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Budget, api } from "@/lib/api";
import { History, Trash2, Eye, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import SectionHeader from "@/components/calculator/SectionHeader";

type SortMode = "recent" | "price_desc" | "price_asc" | "name";

export default function BudgetsHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("recent");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const resp = await api.listBudgets();
        setBudgets(resp.budgets);
      } catch (e) {
        console.error("Erro ao carregar cálculos:", e);
      }
    };

    load();
  }, [user]);

  const visibleBudgets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = budgets.filter((budget) => {
      if (!q) return true;
      const haystack = [budget.name ?? "", budget.clientName ?? "", budget.projectName ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === "price_desc") {
        return b.data.results.finalSalePrice - a.data.results.finalSalePrice;
      }
      if (sortBy === "price_asc") {
        return a.data.results.finalSalePrice - b.data.results.finalSalePrice;
      }
      return (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" });
    });

    return sorted;
  }, [budgets, searchTerm, sortBy]);

  const titleCountBadge =
    budgets.length > 0 ? (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
        {budgets.length}
      </span>
    ) : null;

  const handleDelete = async (budgetId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cálculo?")) return;
    try {
      await api.deleteBudget(budgetId);
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    } catch (e) {
      alert("Erro ao excluir cálculo");
      console.error(e);
    }
  };

  const openBudget = (budgetId: string) => {
    navigate(`${createPageUrl("Calculator")}?budget=${budgetId}`);
  };

  if (!user) {
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Você precisa estar logado para ver seus cálculos</p>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeader
              compact
              icon={<History className="w-5 h-5 text-calcularq-blue" />}
              title="Meus cálculos"
              description="Acesse aqui os cálculos que você salvou no sistema."
              titleAccessory={titleCountBadge}
              iconAlign="center"
              className="mb-0"
            />

            <Link to={createPageUrl("Calculator")} className="w-full sm:w-auto">
              <Button className="bg-calcularq-blue hover:bg-[#002366] text-white w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo cálculo
              </Button>
            </Link>
          </div>

          {budgets.length > 0 ? (
            <div className="mt-4 sticky top-20 z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 rounded-xl bg-slate-50/95 backdrop-blur-sm py-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, cliente ou projeto"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
              />

              <div className="flex items-center gap-2">
                <label htmlFor="budgets-sort" className="text-sm text-slate-600 whitespace-nowrap">
                  Ordenar:
                </label>
                <select
                  id="budgets-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortMode)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                >
                  <option value="recent">Mais recente</option>
                  <option value="price_desc">Maior preço</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="name">Nome (A-Z)</option>
                </select>
              </div>
            </div>
          ) : null}
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
              <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-calcularq-blue">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro cálculo
              </Button>
            </Link>
          </motion.div>
        ) : visibleBudgets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-4">Tente buscar por outro nome, cliente ou projeto.</p>
            <Button type="button" variant="outline" className="border-slate-200 text-slate-700" onClick={() => setSearchTerm("")}>
              Limpar busca
            </Button>
          </motion.div>
        ) : (
          <div
            className={[
              "grid gap-5 sm:gap-6 content-start",
              visibleBudgets.length === 1
                ? "grid-cols-1 max-w-md"
                : visibleBudgets.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-4xl"
                  : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
            ].join(" ")}
          >
            {visibleBudgets.map((budget, index) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition-colors transition-shadow flex flex-col cursor-pointer"
                onClick={() => openBudget(budget.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openBudget(budget.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-calcularq-blue text-lg mb-1 truncate">{budget.name || "Cálculo sem nome"}</h3>
                    {budget.clientName ? <p className="text-sm text-slate-600 truncate">Cliente: {budget.clientName}</p> : null}
                    {budget.projectName ? <p className="text-sm text-slate-600 truncate">Projeto: {budget.projectName}</p> : null}
                    {budget.description ? (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{budget.description}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(budget.id);
                    }}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                  <Button
                    type="button"
                    className="w-full bg-calcularq-blue hover:bg-[#002366] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBudget(budget.id);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
