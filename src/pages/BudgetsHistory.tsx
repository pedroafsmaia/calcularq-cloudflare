import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Budget, api } from "@/lib/api";
import { History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import SectionHeader from "@/components/calculator/SectionHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { fadeUp } from "@/lib/motion";
import BudgetsToolbar from "@/components/budgets/BudgetsToolbar";
import BudgetCard from "@/components/budgets/BudgetCard";
import BudgetDetailsDialog from "@/components/budgets/BudgetDetailsDialog";
import { useToast } from "@/components/ui/ToastProvider";

type SortMode = "recent" | "price_desc" | "price_asc" | "name";

export default function BudgetsHistory() {
  const prefersReducedMotion = !!useReducedMotion();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("recent");
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [detailName, setDetailName] = useState("");
  const [detailClientName, setDetailClientName] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState<string | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const resp = await api.listBudgets();
        setBudgets(resp.budgets);
      } catch (e) {
        toast({
          tone: "error",
          title: "Erro ao carregar cálculos",
          description: "Não foi possível carregar seus cálculos agora.",
        });
        console.error("Erro ao carregar cálculos:", e);
      }
    };

    load();
  }, [user, toast]);

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
    try {
      await api.deleteBudget(budgetId);
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
      toast({
        tone: "success",
        title: "Cálculo excluído",
        description: "O cálculo foi removido com sucesso.",
      });
    } catch (e) {
      toast({
        tone: "error",
        title: "Erro ao excluir cálculo",
        description: "Não foi possível excluir este cálculo.",
      });
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
    if (!force && detailDirty) {
      setConfirmDiscardOpen(true);
      return;
    }
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
      toast({
        tone: "success",
        title: "Alterações salvas",
        description: "Os detalhes do cálculo foram atualizados.",
      });
    } catch (e) {
      toast({
        tone: "error",
        title: "Erro ao salvar alterações",
        description: "Não foi possível salvar os detalhes do cálculo.",
      });
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
    const profit =
      typeof data.results?.adjustedHourlyRate === "number" &&
      typeof data.minHourlyRate === "number" &&
      data.estimatedHours > 0
        ? (data.results.adjustedHourlyRate - data.minHourlyRate) * data.estimatedHours
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
        <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" animate="show" className="mb-6 sm:mb-8">
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

          <BudgetsToolbar
            visible={budgets.length > 0}
            searchTerm={searchTerm}
            sortBy={sortBy}
            onSearchTermChange={setSearchTerm}
            onSortByChange={setSortBy}
          />
        </motion.div>

        {budgets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.18 }}
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
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.18 }}
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
              <BudgetCard
                key={budget.id}
                budget={budget}
                index={index}
                prefersReducedMotion={prefersReducedMotion}
                onOpenDetails={openBudgetDetails}
                onRequestDelete={setConfirmDeleteBudgetId}
              />
            ))}
          </div>
        )}
      </div>

      <BudgetDetailsDialog
        open={!!selectedBudget}
        selectedBudget={selectedBudget}
        detailName={detailName}
        detailClientName={detailClientName}
        detailDescription={detailDescription}
        detailDirty={detailDirty}
        isSavingDetails={isSavingDetails}
        detailPreview={detailPreview}
        onOpenChange={(open) => {
          if (!open) closeBudgetDetails();
        }}
        onDetailNameChange={setDetailName}
        onDetailClientNameChange={setDetailClientName}
        onDetailDescriptionChange={setDetailDescription}
        onOpenCalculator={() => (selectedBudget ? openBudget(selectedBudget.id) : null)}
        onCancel={() => closeBudgetDetails()}
        onSave={handleSaveBudgetDetails}
      />

      <ConfirmDialog
        open={!!confirmDeleteBudgetId}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteBudgetId(null);
        }}
        title="Excluir cálculo"
        description="Tem certeza que deseja excluir este cálculo? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!confirmDeleteBudgetId) return;
          const id = confirmDeleteBudgetId;
          setConfirmDeleteBudgetId(null);
          await handleDelete(id);
        }}
      />

      <ConfirmDialog
        open={confirmDiscardOpen}
        onOpenChange={setConfirmDiscardOpen}
        title="Descartar alterações?"
        description="Você tem alterações não salvas neste cálculo. Deseja descartá-las?"
        confirmLabel="Descartar"
        confirmVariant="danger"
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          closeBudgetDetails(true);
        }}
      />
    </div>
  );
}
