import { useState, useRef, useMemo } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  text: string;
}

/**
 * Tooltip leve e consistente com as caixas de Observação.
 * - Mesmas cores (texto azul) e borda.
 * - Fundo levemente transparente + blur.
 * - Texto formatado em pequenos parágrafos para leitura.
 */
export default function Tooltip({ text }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formattedParts = useMemo(() => {
    const raw = (text || "").trim();
    if (!raw) return [] as string[];

    // Se houver quebras de linha, respeita.
    const byLines = raw
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (byLines.length > 1) return byLines;

    // Caso contrário, tenta separar em frases (PT/EN) sem ser agressivo.
    const bySentences = raw
      .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÃÕÂÊÎÔÛ])/)
      .map((s) => s.trim())
      .filter(Boolean);

    return bySentences.length > 1 ? bySentences : [raw];
  }, [text]);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 120);
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="text-blue-700/90 hover:text-blue-800 transition-colors focus:outline-none"
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
          className="absolute right-0 top-full mt-2 z-50 w-72 max-w-[85vw] rounded-xl px-3.5 py-3 shadow-lg pointer-events-none border border-blue-200 sm:left-6 sm:right-auto sm:top-1/2 sm:mt-0 sm:w-80 sm:-translate-y-1/2"
          style={{
            background: "rgba(239, 246, 255, 0.76)",
            backdropFilter: "blur(10px)",
          }}
          role="tooltip"
        >
          <div className="text-sm text-blue-800 leading-relaxed space-y-1">
            {formattedParts.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Setinha */}
          <span
            className="hidden sm:block absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
            style={{ borderRightColor: "rgba(191, 219, 254, 0.92)" }}
          />
        </span>
      )}
    </span>
  );
}
