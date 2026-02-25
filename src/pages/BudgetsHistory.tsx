import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Budget, api } from "@/lib/api";
import { History, Trash2, Eye, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import SectionHeader from "@/components/calculator/SectionHeader";
import AppDialog from "@/components/ui/AppDialog";

type SortMode = "recent" | "price_desc" | "price_asc" | "name";

export default function BudgetsHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("recent");
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [detailName, setDetailName] = useState("");
  const [detailClientName, setDetailClientName] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

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
      const haystack = [budget.name ?? "", budget.clientName ?? "", budget.projectName ?? "", budget.data?.description ?? ""]
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

  const selectedBudget = useMemo(
    () => budgets.find((budget) => budget.id === selectedBudgetId) ?? null,
    [budgets, selectedBudgetId]
  );

  const detailDirty = useMemo(() => {
    if (!selectedBudget) return false;
    const originalDescription =
      typeof selectedBudget.data?.description === "string" ? selectedBudget.data.description : "";
    return (
      detailName.trim() !== (selectedBudget.name ?? "").trim() ||
      detailClientName.trim() !== (selectedBudget.clientName ?? "").trim() ||
      detailDescription.trim() !== originalDescription.trim()
    );
  }, [selectedBudget, detailName, detailClientName, detailDescription]);

  const openBudgetDetails = (budget: Budget) => {
    setSelectedBudgetId(budget.id);
    setDetailName(budget.name ?? "");
    setDetailClientName(budget.clientName ?? "");
    setDetailDescription(typeof budget.data?.description === "string" ? budget.data.description : "");
  };

  const closeBudgetDetails = (force = false) => {
    if (!force && detailDirty && !confirm("Descartar alterações deste cálculo?")) return;
    setSelectedBudgetId(null);
    setDetailName("");
    setDetailClientName("");
    setDetailDescription("");
    setIsSavingDetails(false);
  };

  const handleSaveBudgetDetails = async () => {
    if (!selectedBudget || !detailName.trim()) return;
    setIsSavingDetails(true);
    try {
      const resp = await api.saveBudget({
        id: selectedBudget.id,
        name: detailName.trim(),
        clientName: detailClientName.trim() || undefined,
        projectName: selectedBudget.projectName || undefined,
        data: {
          ...selectedBudget.data,
          description: detailDescription.trim() || undefined,
        },
      });

      setBudgets((prev) => prev.map((budget) => (budget.id === resp.budget.id ? resp.budget : budget)));
      setSelectedBudgetId(resp.budget.id);
    } catch (e) {
      alert("Erro ao salvar alterações do cálculo");
      console.error(e);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const detailPreview = useMemo(() => {
    if (!selectedBudget) return null;
    const data = selectedBudget.data;
    const totalVariableExpenses = Array.isArray(data.variableExpenses)
      ? data.variableExpenses.reduce((sum, exp) => sum + (exp.value || 0), 0)
      : 0;
    const discountPercent = typeof data.commercialDiscount === "number" ? data.commercialDiscount : 0;
    const discountAmount = (data.results?.projectPrice || 0) * (discountPercent / 100);
    const area = typeof data.area === "number" && data.area > 0 ? data.area : null;
    const cubPercentage =
      area && data.results?.finalSalePrice > 0 ? (data.results.finalSalePrice / (2800 * area)) * 100 : null;
    const pricePerSqm = area && data.results?.finalSalePrice > 0 ? data.results.finalSalePrice / area : null;
    const fixedExpensesTotal = Array.isArray(data.fixedExpenses)
      ? data.fixedExpenses.reduce((sum, exp) => sum + (exp.value || 0), 0)
      : 0;
    const fixedCostPerHour = data.productiveHours && data.productiveHours > 0 ? fixedExpensesTotal / data.productiveHours : 0;
    const projectPriceWithDiscount = (data.results?.projectPrice || 0) * (1 - discountPercent / 100);
    const profit =
      fixedCostPerHour > 0 && data.estimatedHours > 0
        ? projectPriceWithDiscount - fixedCostPerHour * data.estimatedHours
        : null;

    return {
      totalVariableExpenses,
      discountPercent,
      discountAmount,
      cubPercentage,
      pricePerSqm,
      profit,
    };
  }, [selectedBudget]);

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
                onClick={() => openBudgetDetails(budget)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openBudgetDetails(budget);
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
                      openBudgetDetails(budget);
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

      <AppDialog
        open={!!selectedBudget}
        onOpenChange={(open) => {
          if (!open) closeBudgetDetails();
        }}
        title="Detalhes do cálculo"
        description="Edite as informações salvas e consulte um resumo dos resultados."
        maxWidthClassName="max-w-3xl"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => (selectedBudget ? openBudget(selectedBudget.id) : null)}
              disabled={!selectedBudget}
            >
              Abrir na calculadora
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => closeBudgetDetails()}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-calcularq-blue hover:bg-[#002366] text-white"
                onClick={handleSaveBudgetDetails}
                disabled={!selectedBudget || !detailName.trim() || isSavingDetails || !detailDirty}
              >
                {isSavingDetails ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        }
      >
        {selectedBudget ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do cálculo *</label>
                <input
                  type="text"
                  value={detailName}
                  onChange={(e) => setDetailName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do cliente (opcional)</label>
                <input
                  type="text"
                  value={detailClientName}
                  onChange={(e) => setDetailClientName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Descrição (opcional)</label>
                <textarea
                  rows={4}
                  value={detailDescription}
                  onChange={(e) => setDetailDescription(e.target.value)}
                  className="w-full min-h-[7rem] max-h-56 resize-y rounded-lg border border-slate-300 px-3 py-2.5 focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue"
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
    </div>
  );
}
