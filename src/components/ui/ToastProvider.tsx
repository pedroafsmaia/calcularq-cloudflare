import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { Button } from "./button";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title?: string;
  description: string;
  tone: ToastTone;
  durationMs: number;
};

type ToastInput = {
  title?: string;
  description: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timeoutIds = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    const timer = timeoutIds.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timeoutIds.current[id];
    }
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "info", durationMs = 3200 }: ToastInput) => {
      const id = crypto.randomUUID();
      const item: ToastItem = { id, title, description, tone, durationMs };
      setItems((prev) => [...prev, item]);
      timeoutIds.current[id] = setTimeout(() => removeToast(id), durationMs);
    },
    [removeToast]
  );

  const contextValue = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4 sm:justify-end sm:px-6">
        <div className="flex w-full max-w-md flex-col gap-2">
          <AnimatePresence>
            {items.map((item) => {
              const toneClasses =
                item.tone === "success"
                  ? "border-emerald-200 bg-emerald-50/95 text-emerald-800"
                  : item.tone === "error"
                    ? "border-red-200 bg-red-50/95 text-red-800"
                    : "border-blue-200 bg-blue-50/95 text-blue-800";

              const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? AlertCircle : Info;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`pointer-events-auto rounded-2xl border shadow-sm ${toneClasses}`}
                >
                  <div className="flex items-start gap-3 p-3.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      {item.title ? <p className="text-sm font-semibold">{item.title}</p> : null}
                      <p className={`text-sm leading-relaxed ${item.title ? "mt-0.5" : ""}`}>{item.description}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-white/50"
                      onClick={() => removeToast(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
