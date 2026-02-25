import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/button";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export default function LegalModal({ isOpen, onClose, title, content }: LegalModalProps) {
  return (
    <AppDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={title}
      maxWidthClassName="max-w-3xl"
      footer={
        <Button
          type="button"
          onClick={onClose}
          className="w-full bg-calcularq-blue hover:bg-[#002366] text-white"
        >
          Fechar
        </Button>
      }
    >
      <div
        className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </AppDialog>
  );
}
