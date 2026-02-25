import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
  scrollBehavior?: "inner" | "mobile-inner";
}

export default function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidthClassName = "max-w-lg",
  scrollBehavior = "inner",
}: AppDialogProps) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (typeof document === "undefined") return null;

  const useMobileInnerScroll = scrollBehavior === "mobile-inner";

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            key="dialog-shell"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[101] flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4"
            style={{
              paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
              paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))",
            }}
            onClick={() => onOpenChange(false)}
          >
            <div
              className={`my-4 w-full ${maxWidthClassName} rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col ${
                useMobileInnerScroll
                  ? "overflow-hidden sm:overflow-visible max-h-[calc(100dvh-7rem)] sm:max-h-none"
                  : "overflow-hidden"
              }`}
              style={useMobileInnerScroll ? undefined : { maxHeight: "min(48rem, calc(100dvh - 2rem - env(safe-area-inset-bottom, 0px)))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-calcularq-blue">{title}</h3>
                  {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-9 w-9 shrink-0 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className={`px-5 py-4 sm:px-6 ${useMobileInnerScroll ? "overflow-y-auto sm:overflow-visible" : "overflow-y-auto"}`}>
                {children}
              </div>

              {footer ? (
                <div
                  className="border-t border-slate-200 px-5 py-4 sm:px-6"
                  style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
                >
                  {footer}
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
