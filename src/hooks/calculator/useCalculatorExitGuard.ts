import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";

import { clearCalculatorDraft } from "@/lib/calculatorDraft";

type Params = {
  hydrationComplete: boolean;
  shouldClearDraftOnExit: boolean;
  setShouldClearDraftOnExit: Dispatch<SetStateAction<boolean>>;
  lastCommittedHash: string | null;
  setLastCommittedHash: Dispatch<SetStateAction<string | null>>;
  calculatorStateHash: string;
};

export function useCalculatorExitGuard({
  hydrationComplete,
  shouldClearDraftOnExit,
  setShouldClearDraftOnExit,
  lastCommittedHash,
  setLastCommittedHash,
  calculatorStateHash,
}: Params) {
  const navigate = useNavigate();
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  const hasUnsavedChanges = useMemo(() => {
    if (!hydrationComplete || !lastCommittedHash) return false;
    if (shouldClearDraftOnExit) return false;
    return calculatorStateHash !== lastCommittedHash;
  }, [calculatorStateHash, hydrationComplete, lastCommittedHash, shouldClearDraftOnExit]);

  useEffect(() => {
    if (!hydrationComplete || lastCommittedHash !== null) return;
    setLastCommittedHash(calculatorStateHash);
  }, [calculatorStateHash, hydrationComplete, lastCommittedHash, setLastCommittedHash]);

  useEffect(() => {
    const clearDraft = () => {
      if (!shouldClearDraftOnExit) return;
      clearCalculatorDraft();
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = "";
      }
      clearDraft();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      clearDraft();
    };
  }, [hasUnsavedChanges, shouldClearDraftOnExit]);

  useEffect(() => {
    if (!shouldClearDraftOnExit || !lastCommittedHash) return;
    if (calculatorStateHash !== lastCommittedHash) {
      setShouldClearDraftOnExit(false);
    }
  }, [calculatorStateHash, lastCommittedHash, setShouldClearDraftOnExit, shouldClearDraftOnExit]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      const isSameDocument =
        destination.origin === current.origin &&
        destination.pathname === current.pathname &&
        destination.search === current.search &&
        destination.hash === current.hash;

      if (isSameDocument) return;

      event.preventDefault();
      pendingNavigationRef.current = () => {
        if (destination.origin === current.origin) {
          navigate(`${destination.pathname}${destination.search}${destination.hash}`);
          return;
        }

        window.location.assign(destination.href);
      };
      setConfirmLeaveOpen(true);
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [hasUnsavedChanges, navigate]);

  const markCommitted = () => {
    setShouldClearDraftOnExit(true);
    setLastCommittedHash(calculatorStateHash);
  };

  const resetCommittedState = () => {
    setLastCommittedHash(null);
    setShouldClearDraftOnExit(false);
  };

  const confirmPendingNavigation = useCallback(() => {
    const proceed = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setConfirmLeaveOpen(false);
    proceed?.();
  }, []);

  const cancelPendingNavigation = useCallback(() => {
    pendingNavigationRef.current = null;
    setConfirmLeaveOpen(false);
  }, []);

  return {
    hasUnsavedChanges,
    confirmLeaveOpen,
    setConfirmLeaveOpen,
    confirmPendingNavigation,
    cancelPendingNavigation,
    markCommitted,
    resetCommittedState,
  };
}
