import { useEffect, useRef, useState } from "react";

import type { CalculatorDraft } from "@/types/budget";
import { loadCalculatorDraft, saveCalculatorDraft } from "@/lib/calculatorDraft";

type UseCalculatorDraftSyncParams = {
  enabled: boolean;
  budgetId: string | null;
  draftData: CalculatorDraft;
  applyDraft: (draft: CalculatorDraft) => void;
};

export function useCalculatorDraftSync({
  enabled,
  budgetId,
  draftData,
  applyDraft,
}: UseCalculatorDraftSyncParams) {
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const [hydrationComplete, setHydrationComplete] = useState(false);
  const draftSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftStatusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRestoredRef = useRef(false);

  useEffect(() => {
    if (!enabled || budgetId) return;
    if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    setDraftStatus("saving");
    draftSaveRef.current = setTimeout(() => {
      saveCalculatorDraft({
        ...draftData,
        savedAt: Date.now(),
      });
      setLastDraftSavedAt(Date.now());
      setDraftStatus("saved");
      if (draftStatusResetRef.current) clearTimeout(draftStatusResetRef.current);
      draftStatusResetRef.current = setTimeout(() => setDraftStatus("idle"), 1500);
    }, 800);
  }, [budgetId, draftData, enabled]);

  useEffect(() => {
    if (draftRestoredRef.current || budgetId || !enabled) return;
    draftRestoredRef.current = true;

    const draft = loadCalculatorDraft();
    if (!draft || !draft.minHourlyRate) {
      setHydrationComplete(true);
      return;
    }

    const age = Date.now() - (draft.savedAt || 0);
    if (age > 24 * 60 * 60 * 1000) {
      setHydrationComplete(true);
      return;
    }

    applyDraft(draft);
    setLastDraftSavedAt(draft.savedAt ?? null);
    setDraftStatus("saved");
    setHydrationComplete(true);
  }, [applyDraft, budgetId, enabled]);

  useEffect(() => {
    return () => {
      if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
      if (draftStatusResetRef.current) clearTimeout(draftStatusResetRef.current);
    };
  }, []);

  return {
    draftStatus,
    setDraftStatus,
    lastDraftSavedAt,
    hydrationComplete,
    setHydrationComplete,
  };
}
