import { useState, useRef } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  text: string;
}

export default function Tooltip({ text }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="text-slate-400 hover:text-calcularq-blue transition-colors focus:outline-none"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-label="Mais informações"
      >
        <Info className="w-4 h-4" />
      </button>

      {visible && (
        <span
          className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed pointer-events-none"
          role="tooltip"
        >
          {text}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
        </span>
      )}
    </span>
  );
}
