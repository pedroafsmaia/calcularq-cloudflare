import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      maxWidthClassName="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-calcularq-blue hover:bg-[#002366] text-white"
            }
            onClick={() => void onConfirm()}
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-slate-600 leading-relaxed">
        {description || "Tem certeza que deseja continuar?"}
      </div>
    </AppDialog>
  );
}
