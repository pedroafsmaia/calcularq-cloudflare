import { useEffect, useMemo, useState } from "react";
import { Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppDialog from "@/components/ui/AppDialog";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

interface SaveBudgetButtonProps {
  budgetId?: string;
  initialBudgetName?: string;
  initialClientName?: string;
  initialDescription?: string;
  budgetData: {
    description?: string;
    minHourlyRate: number;
    useManualMinHourlyRate?: boolean;
    area?: number | null;
    factors: Array<{ id: string; name: string; weight: number; level: number }>;
    areaIntervals: Array<{ min: number; max: number | null; level: number }>;
    selections: Record<string, number>;
    estimatedHours: number;
    fixedExpenses?: Array<{ id: string; name: string; value: number }>;
    personalExpenses?: Array<{ id: string; name: string; value: number }>;
    proLabore?: number;
    productiveHours?: number;
    commercialDiscount?: number;
    variableExpenses: Array<{ id: string; name: string; value: number }>;
    results: {
      globalComplexity: number;
      adjustedHourlyRate: number;
      projectPrice: number;
      finalSalePrice: number;
    };
  };
  projectName?: string;
  clientName?: string;
}

export default function SaveBudgetButton({
  budgetId,
  initialBudgetName,
  initialClientName,
  initialDescription,
  budgetData,
  projectName,
  clientName,
}: SaveBudgetButtonProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [budgetName, setBudgetName] = useState(initialBudgetName || projectName || "");
  const [clientNameValue, setClientNameValue] = useState(initialClientName || clientName || "");
  const [description, setDescription] = useState(initialDescription || budgetData.description || "");

  useEffect(() => {
    setBudgetName(initialBudgetName || projectName || "");
  }, [initialBudgetName, projectName]);

  useEffect(() => {
    setClientNameValue(initialClientName || clientName || "");
  }, [initialClientName, clientName]);

  useEffect(() => {
    setDescription(initialDescription || budgetData.description || "");
  }, [initialDescription, budgetData.description]);

  const canSave = useMemo(() => budgetName.trim().length > 0, [budgetName]);

  const handleSave = async () => {
    if (!user) {
      alert("Você precisa estar logado para salvar cálculos");
      return;
    }

    const finalName = budgetName.trim();
    if (!finalName) return;

    setIsSaving(true);

    try {
      const payload = {
        id: budgetId || undefined,
        name: finalName || `Cálculo ${new Date().toLocaleDateString("pt-BR")}`,
        clientName: clientNameValue.trim() || undefined,
        projectName: projectName || undefined,
        data: {
          ...budgetData,
          description: description.trim() || undefined,
        },
      };

      const resp = await api.saveBudget(payload);
      const savedId = resp.budget.id;

      if (!budgetId && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("budget", savedId);
        window.history.replaceState({}, "", url.toString());
      }

      setIsDialogOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert("Erro ao salvar cálculo");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <Link to={createPageUrl("Login")}>
        <Button className="w-full bg-calcularq-blue hover:bg-[#002366] text-white">
          <Save className="w-4 h-4 mr-2" />
          Faça login para salvar
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        disabled={isSaving || saved}
        className="w-full bg-calcularq-blue hover:bg-[#002366] text-white"
      >
        {saved ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Salvo com sucesso!
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar cálculo"}
          </>
        )}
      </Button>

      <AppDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Salvar cálculo"
        description="Salve este cálculo para continuar depois e consultar seus resultados."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !canSave}
              className="bg-calcularq-blue hover:bg-[#002366] text-white"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do cálculo *</label>
                <input
                  type="text"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="Ex.: Proposta residencial base"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do cliente (opcional)</label>
                <input
                  type="text"
                  value={clientNameValue}
                  onChange={(e) => setClientNameValue(e.target.value)}
                  placeholder="Ex.: Maria Silva"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Descrição (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Ex.: estudo preliminar, revisão com desconto, versão para negociação..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue"
                />
              </div>
            </div>
      </AppDialog>
    </>
  );
}
