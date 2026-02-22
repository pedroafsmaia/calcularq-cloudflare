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
        className="text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
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
          className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-72 text-blue-800 text-xs rounded-xl px-3 py-2.5 shadow-lg leading-relaxed pointer-events-none border border-blue-200"
          style={{ background: "rgba(239, 246, 255, 0.78)", backdropFilter: "blur(8px)" }}
          role="tooltip"
        >
          {text}
          <span
            className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
            style={{ borderRightColor: "rgba(239, 246, 255, 0.78)" }}
          />
        </span>
      )}
    </span>
  );
}
