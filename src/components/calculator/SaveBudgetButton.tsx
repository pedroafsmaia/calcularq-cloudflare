import { useState } from "react";
import { Save, Check, X } from "lucide-react";
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
  const [showModal, setShowModal] = useState(false);
  const [modalName, setModalName] = useState(initialBudgetName || projectName || "");
  const [modalClient, setModalClient] = useState(clientName || "");
  const [modalDescription, setModalDescription] = useState("");
  const [nameError, setNameError] = useState(false);

  const openModal = () => {
    setModalName(initialBudgetName || projectName || "");
    setModalClient(clientName || "");
    setModalDescription("");
    setNameError(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    const finalName = modalName.trim();
    if (!finalName) {
      setNameError(true);
      return;
    }

    setIsSaving(true);
    setNameError(false);

    try {
      const payload = {
        id: budgetId || undefined,
        name: finalName,
        clientName: modalClient.trim() || undefined,
        description: modalDescription.trim() || undefined,
        data: budgetData,
      };

      const resp = await api.saveBudget(payload);
      const savedId = resp.budget.id;
      if (!budgetId && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("budget", savedId);
        window.history.replaceState({}, "", url.toString());
      }

      setShowModal(false);
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
        onClick={openModal}
        disabled={saved}
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
            Salvar cálculo
          </>
        )}
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-calcularq-blue">Salvar cálculo</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome do cálculo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => { setModalName(e.target.value); setNameError(false); }}
                  placeholder="Ex: Casa João Silva"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue outline-none ${nameError ? "border-red-400" : "border-slate-300"}`}
                  autoFocus
                />
                {nameError && (
                  <p className="text-xs text-red-500 mt-1">O nome do cálculo é obrigatório.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome do cliente{" "}
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={modalClient}
                  onChange={(e) => setModalClient(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descrição{" "}
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Ex: Projeto de interiores para apartamento no centro..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1 border-slate-200 text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-calcularq-blue hover:bg-[#002366] text-white"
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
