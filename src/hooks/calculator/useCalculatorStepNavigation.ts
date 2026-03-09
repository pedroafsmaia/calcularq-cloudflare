import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

type StepDefinition = {
  n: number;
  label: string;
  line1: string;
  line2: string;
};

type Params = {
  currentStep: number;
  maxStepReached: number;
  steps: StepDefinition[];
  canAdvance: boolean;
  stepComplete: (stepNumber: number) => boolean;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  confirmClearAllOpen: boolean;
  confirmClearStepOpen: boolean;
  importStepDialogOpen: boolean;
  confirmLeaveOpen: boolean;
};

export function useCalculatorStepNavigation({
  currentStep,
  maxStepReached,
  steps,
  canAdvance,
  stepComplete,
  setCurrentStep,
  confirmClearAllOpen,
  confirmClearStepOpen,
  importStepDialogOpen,
  confirmLeaveOpen,
}: Params) {
  const mobileStepperRef = useRef<HTMLDetailsElement | null>(null);
  const stepContentTopRef = useRef<HTMLDivElement | null>(null);
  const previousStepRef = useRef(currentStep);

  const currentStepLabel = useMemo(
    () => steps.find((step) => step.n === currentStep)?.label ?? `Etapa ${currentStep}`,
    [currentStep, steps]
  );

  const stepVisualDone = useCallback((stepNumber: number) => maxStepReached > stepNumber, [maxStepReached]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length && canAdvance) {
      setCurrentStep((step) => step + 1);
    }
  }, [canAdvance, currentStep, setCurrentStep, steps.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
    }
  }, [currentStep, setCurrentStep]);

  const goToStep = useCallback(
    (stepNumber: number) => {
      const canGoToReached = stepNumber <= maxStepReached;
      const canGoToNext = stepNumber === maxStepReached + 1 && stepComplete(stepNumber - 1);
      if (canGoToReached || canGoToNext) setCurrentStep(stepNumber);
    },
    [maxStepReached, setCurrentStep, stepComplete]
  );

  useEffect(() => {
    if (previousStepRef.current === currentStep) return;
    previousStepRef.current = currentStep;

    const target = stepContentTopRef.current;
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [currentStep]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcutCombo = event.altKey && !event.ctrlKey && !event.metaKey;
      if (!isShortcutCombo && isTypingTarget(event.target)) return;
      if (confirmClearAllOpen || confirmClearStepOpen || importStepDialogOpen || confirmLeaveOpen) return;

      if (!isShortcutCombo) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (currentStep < steps.length && canAdvance) {
          setCurrentStep((step) => step + 1);
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (currentStep > 1) {
          setCurrentStep((step) => step - 1);
        }
        return;
      }

      const digitFromCode = (() => {
        const maxDigit = Math.min(steps.length, 9);
        const pattern = new RegExp(`^[1-${maxDigit}]$`);
        const codePattern = new RegExp(`^(Digit|Numpad)[1-${maxDigit}]$`);

        if (codePattern.test(event.code)) return Number(event.code.replace(/\D/g, ""));
        if (pattern.test(event.key)) return Number(event.key);
        return null;
      })();

      if (digitFromCode !== null) {
        event.preventDefault();
        const targetStep = digitFromCode;
        const canGoToReached = targetStep <= maxStepReached;
        const canGoToNext = targetStep === maxStepReached + 1 && stepComplete(targetStep - 1);
        if (canGoToReached || canGoToNext) setCurrentStep(targetStep);
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [
    canAdvance,
    confirmClearAllOpen,
    confirmClearStepOpen,
    confirmLeaveOpen,
    currentStep,
    importStepDialogOpen,
    maxStepReached,
    setCurrentStep,
    stepComplete,
    steps.length,
  ]);

  return {
    currentStepLabel,
    stepVisualDone,
    handleNext,
    handleBack,
    goToStep,
    mobileStepperRef,
    stepContentTopRef,
  };
}
