import { ReactNode } from "react";

type SectionHeaderProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  titleAccessory?: ReactNode;
  className?: string;
  descriptionClassName?: string;
  titleClassName?: string;
  compact?: boolean;
  iconAlign?: "start" | "center";
};

export default function SectionHeader({
  icon,
  title,
  description,
  titleAccessory,
  className = "",
  descriptionClassName = "",
  titleClassName = "",
  compact = false,
  iconAlign = "start",
}: SectionHeaderProps) {
  return (
    <div className={`flex ${iconAlign === "center" ? "items-center" : "items-start"} gap-3 ${compact ? "mb-5" : "mb-6"} ${className}`.trim()}>
      <div className="w-11 h-11 min-w-11 shrink-0 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className={`text-xl sm:text-2xl font-bold text-calcularq-blue ${titleClassName}`.trim()}>
            {title}
          </h2>
          {titleAccessory}
        </div>
        {description ? (
          <p
            className={`text-sm sm:text-base text-slate-500 mt-1 leading-relaxed max-w-[64ch] ${descriptionClassName}`.trim()}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
