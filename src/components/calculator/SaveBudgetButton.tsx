import { useState } from "react";
import { Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

interface SaveBudgetButtonProps {
  budgetId?: string;
  initialBudgetName?: string;
  budgetData: {
    minHourlyRate: number;
    useManualMinHourlyRate?: boolean;
    area?: number | null;
    factors: Array<{ id: string; name: string; weight: number; level: number }>;
    areaIntervals: Array<{ min: number; max: number | null; level: number }>;
    selections: Record<string, number>;
    estimatedHours: number;
    fixedExpenses?: Array<{ id: string; name: string; value: number }>;
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

export default function SaveBudgetButton({ budgetId, initialBudgetName, budgetData, projectName, clientName }: SaveBudgetButtonProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [budgetName, setBudgetName] = useState(initialBudgetName || projectName || "");

  const handleSave = async () => {
    if (!user) {
      alert("Você precisa estar logado para salvar cálculos");
      return;
    }

    let finalName = budgetName.trim();
    if (!finalName) {
      const name = prompt("Digite um nome para este cálculo:");
      if (!name || !name.trim()) {
        return;
      }
      finalName = name.trim();
      setBudgetName(finalName);
    }

    setIsSaving(true);

    try {
      const payload = {
        id: budgetId || undefined,
        name: finalName || `Cálculo ${new Date().toLocaleDateString("pt-BR")}`,
        clientName: clientName || undefined,
        projectName: projectName || undefined,
        data: budgetData,
      };

      const resp = await api.saveBudget(payload);
      // Atualiza a URL para o ID salvo, se era um novo
      const savedId = resp.budget.id;
      if (!budgetId && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('budget', savedId);
        window.history.replaceState({}, '', url.toString());
      }

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
    <div className="space-y-2">
      <input
        type="text"
        value={budgetName}
        onChange={(e) => setBudgetName(e.target.value)}
        placeholder="Nome do cálculo"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue"
      />
      <Button
        onClick={handleSave}
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
    </div>
  );
}
