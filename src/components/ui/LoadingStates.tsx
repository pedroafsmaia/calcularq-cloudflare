import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const spinnerSizeClasses: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block animate-spin rounded-full border-slate-200 border-t-calcularq-blue",
        spinnerSizeClasses[size],
        className
      )}
    />
  );
}

type PageLoadingStateProps = {
  label?: string;
  compact?: boolean;
};

export function PageLoadingState({ label = "Carregando...", compact = false }: PageLoadingStateProps) {
  return (
    <div
      className={cn(
        "bg-slate-50 px-4",
        compact ? "py-10" : "min-h-screen py-16"
      )}
    >
      <div className={cn("mx-auto flex items-center justify-center", compact ? "min-h-[180px]" : "min-h-[60vh]")}>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm sm:px-8 sm:py-6">
          <LoadingSpinner size="md" className="mb-3" />
          <p className="text-sm text-slate-600">{label}</p>
        </div>
      </div>
    </div>
  );
}
