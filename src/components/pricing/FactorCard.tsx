import { Factor } from "./PricingEngine";
import Tooltip from "@/components/ui/Tooltip";

const FACTOR_TOOLTIPS: Record<string, string> = {
  stage: "Define até qual fase do ciclo de desenvolvimento você irá trabalhar — de uma consultoria simples até a compatibilização completa de todos os projetos complementares (estrutural, elétrico, hidráulico, etc.).",
  detail: "Mede a quantidade de desenhos e o esforço criativo exigido. Soluções autorais e inéditas demandam muito mais trabalho do que projetos com itens de catálogo e marcenaria convencional.",
  technical: "Define a rigidez das normas técnicas e o volume de estudo necessário. Hospitais, patrimônios históricos e escolas exigem domínio de legislações muito mais complexas que um projeto residencial simples.",
  bureaucratic: "Mede a carga de aprovações em órgãos públicos. Inclui prefeitura, corpo de bombeiros, vigilância sanitária, licenciamento ambiental e outros processos administrativos envolvidos.",
  monitoring: "Frequência de visitas e nível de responsabilidade durante a obra — desde uma visita única de levantamento de medidas até a gestão completa de compras, cronograma e equipe.",
};

interface FactorCardProps {
  factor: Factor;
  value?: number;
  onChange: (factorId: string, value: number) => void;
}

export default function FactorCard({ factor, value, onChange }: FactorCardProps) {
  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-slate-300 hover:shadow-sm transition-colors transition-shadow duration-150">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="min-w-0 flex items-center gap-1.5 font-semibold text-slate-900">
            {factor.name}
            {FACTOR_TOOLTIPS[factor.id] && (
              <Tooltip text={FACTOR_TOOLTIPS[factor.id]} />
            )}
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
            className={`
              flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors bg-white
              ${
                value === option.value
                  ? "border-calcularq-blue shadow-sm"
                  : "border-slate-200 hover:border-calcularq-blue/40"
              }
            `}
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
              <div className="font-medium text-slate-900 text-sm">
                {option.label}
              </div>
              {option.description && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {option.description}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

