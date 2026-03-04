import { Factor } from "./PricingEngine";
import Tooltip from "@/components/ui/Tooltip";

const FACTOR_TOOLTIPS: Record<string, string> = {
  tipology: [
    "Tipologia",
    "• Residencial: Casas e apartamentos padrão",
    "• Comercial/Serviços: Lojas, escritórios e afins",
    "• Institucional: Escolas, sedes públicas e similares",
    "• Industrial: Galpões e plantas produtivas",
    "• Saúde: Clínicas e hospitais com alta exigência técnica",
  ].join("\n"),
  stage: [
    "Etapa final",
    "• Consultoria/Briefing: Diretrizes iniciais",
    "• Estudo preliminar: Conceito e partido",
    "• Anteprojeto: Solução consolidada",
    "• Projeto executivo: Detalhamento para obra",
    "• Compatibilização de complementares: Coordenação técnica completa",
  ].join("\n"),
  detail: [
    "Nível de Detalhamento",
    "Quanto detalhamento você vai entregar:",
    "• Mínimo: Diretrizes gerais",
    "• Básico: Soluções padronizadas",
    "• Médio: Equilíbrio catálogo/sob medida",
    "• Alto: Forte personalização",
    "• Máximo: Detalhamento exaustivo",
  ].join("\n"),
  technical: [
    "Exigência Técnica",
    "• Mínima: Baixa restrição normativa",
    "• Baixa: Exigências técnicas simples",
    "• Média: Requisitos usuais de mercado",
    "• Alta: Requisitos técnicos relevantes",
    "• Máxima: Normas rígidas e alto risco técnico",
  ].join("\n"),
  bureaucratic: [
    "Exigência Burocrática",
    "• Mínima: Poucas aprovações",
    "• Baixa: Trâmite simples",
    "• Média: Aprovações regulares",
    "• Alta: Múltiplos órgãos e documentos",
    "• Máxima: Fluxo complexo e demorado",
  ].join("\n"),
  monitoring: [
    "Dedicação à Obra",
    "• Levantamento: Sem acompanhamento contínuo",
    "• Pontual: Visitas esporádicas",
    "• Por etapas: Presença em marcos da obra",
    "• Acompanhamento: Presença frequente",
    "• Gestão: Coordenação ativa de execução",
  ].join("\n"),
};

interface FactorCardProps {
  factor: Factor;
  value?: number;
  onChange: (factorId: string, value: number) => void;
  reformValue?: boolean;
  onReformChange?: (value: boolean) => void;
}

export default function FactorCard({ factor, value, onChange, reformValue, onReformChange }: FactorCardProps) {
  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-slate-300 hover:shadow-sm transition-colors transition-shadow duration-150">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="min-w-0 flex items-center gap-1.5 font-semibold text-slate-900">
            {factor.name}
            {FACTOR_TOOLTIPS[factor.id] ? <Tooltip text={FACTOR_TOOLTIPS[factor.id]} /> : null}
          </h3>
          <span className="shrink-0 text-xs text-calcularq-blue bg-calcularq-blue/10 border border-calcularq-blue/20 px-2 py-1 rounded-md">
            Peso: {factor.weight}
          </span>
        </div>
        <p className="text-sm text-slate-500">{factor.description}</p>
      </div>

      <div className="space-y-2">
        {factor.options.map((option) => (
          <label
            key={option.value}
            className={[
              "flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors bg-white",
              value === option.value ? "border-calcularq-blue shadow-sm" : "border-slate-200 hover:border-calcularq-blue/40",
            ].join(" ")}
          >
            <input
              type="radio"
              name={factor.id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(factor.id, option.value)}
              className="mt-0.5 w-4 h-4 text-calcularq-blue focus:ring-calcularq-blue"
            />
            <div className="flex-1">
              <div className="font-medium text-slate-900 text-sm">{option.label}</div>
            </div>
          </label>
        ))}
      </div>

      {factor.id === "tipology" ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(reformValue)}
              onChange={(event) => onReformChange?.(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-calcularq-blue focus:ring-calcularq-blue"
            />
            <span>Reforma/Ampliação</span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
