import { useEffect, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  text: string;
  iconClassName?: string;
}

/**
 * Tooltip leve e consistente com as caixas de Observação.
 * - Mesmas cores (texto azul) e borda.
 * - Fundo levemente transparente + blur.
 * - Texto formatado em pequenos parágrafos para leitura.
 */
export default function Tooltip({ text, iconClassName }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

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

  useEffect(() => {
    if (!visible) return;

    const updatePosition = () => {
      const trigger = buttonRef.current;
      const bubble = tooltipRef.current;
      if (!trigger || !bubble) return;

      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const padding = 8;
      const gap = 8;
      const mobile = viewportW < 640;
      const width = Math.min(mobile ? 320 : 360, viewportW - padding * 2);

      bubble.style.width = `${width}px`;

      const triggerRect = trigger.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();

      let left = mobile
        ? triggerRect.left + triggerRect.width / 2 - width / 2
        : triggerRect.right + gap;

      if (!mobile && left + width > viewportW - padding) {
        left = triggerRect.left - width - gap;
      }

      left = Math.min(Math.max(left, padding), viewportW - width - padding);

      let top = mobile
        ? triggerRect.bottom + gap
        : triggerRect.top + triggerRect.height / 2 - bubbleRect.height / 2;

      if (mobile && top + bubbleRect.height > viewportH - padding) {
        top = triggerRect.top - bubbleRect.height - gap;
      }

      top = Math.min(Math.max(top, padding), viewportH - bubbleRect.height - padding);

      const maxHeight = Math.max(120, viewportH - padding * 2);
      setPosition({ left, top, width, maxHeight });
    };

    const raf = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [visible, text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        className={`transition-colors focus:outline-none ${iconClassName ?? "text-blue-700/90 hover:text-blue-800"}`}
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
          ref={tooltipRef}
          className="fixed z-50 rounded-xl px-3.5 py-3 shadow-lg pointer-events-none border border-blue-200 font-normal"
          style={{
            left: position?.left ?? 8,
            top: position?.top ?? 8,
            width: position?.width ?? undefined,
            maxHeight: position?.maxHeight ?? undefined,
            overflowY: "auto",
            background: "rgba(239, 246, 255, 0.76)",
            backdropFilter: "blur(10px)",
          }}
          role="tooltip"
        >
          <div className="text-sm text-blue-800 leading-relaxed space-y-1 font-normal">
            {formattedParts.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </span>
      )}
    </span>
  );
}
