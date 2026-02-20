import { LucideIcon } from "lucide-react";

interface SectionTitleProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function SectionTitle({ icon: Icon, title, description }: SectionTitleProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      </div>
      {description && (
        <p className="text-slate-500 ml-13">{description}</p>
      )}
    </div>
  );
}
