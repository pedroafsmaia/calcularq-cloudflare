import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calculator,
  Settings2,
  Layers,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import SectionHeader from "@/components/calculator/SectionHeader";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

type FactorId = "area" | "stage" | "detail" | "technical" | "bureaucratic" | "monitoring";

const manualSteps = [
  { id: "introducao", label: "Visão geral", short: "Introdução" },
  { id: "etapa-1", label: "Hora técnica mínima", short: "Hora técnica mínima" },
  { id: "etapa-2", label: "Calibragem dos pesos", short: "Calibragem dos pesos" },
  { id: "etapa-3", label: "Análise dos Fatores de Complexidade", short: "Fatores de Complexidade" },
  { id: "etapa-4", label: "Composição final do preço", short: "Composição final" },
  { id: "encerramento", label: "Conclusão", short: "Final" },
] as const;

function ManualCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 lg:p-8 ${className}`.trim()}>
      {children}
    </section>
  );
}

function NoteBox({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "amber" | "slate" }) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "slate"
        ? "border-slate-200 bg-slate-50 text-slate-700"
        : "border-calcularq-blue/20 bg-calcularq-blue/5 text-slate-700";

  return <div className={`rounded-xl border px-4 py-3 leading-relaxed ${toneClass}`}>{children}</div>;
}

export default function Manual() {
  const [activeStepId, setActiveStepId] = useState<(typeof manualSteps)[number]["id"]>("introducao");
  const [expandedFactors, setExpandedFactors] = useState<Record<FactorId, boolean>>({
    area: true,
    stage: false,
    detail: false,
    technical: false,
    bureaucratic: false,
    monitoring: false,
  });

  const toggleFactor = (factorId: FactorId) => {
    setExpandedFactors((prev) => ({
      ...prev,
      [factorId]: !prev[factorId],
    }));
  };

  const activeStepIndex = useMemo(
    () => Math.max(0, manualSteps.findIndex((step) => step.id === activeStepId)),
    [activeStepId]
  );

  const scrollToSection = (id: (typeof manualSteps)[number]["id"]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top, behavior: "smooth" });
  };

  useEffect(() => {
    const updateActiveStep = () => {
      let current: (typeof manualSteps)[number]["id"] = manualSteps[0].id;
      for (const step of manualSteps) {
        const el = document.getElementById(step.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 140) current = step.id;
      }
      setActiveStepId(current);
    };

    updateActiveStep();
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    window.addEventListener("resize", updateActiveStep);
    return () => {
      window.removeEventListener("scroll", updateActiveStep);
      window.removeEventListener("resize", updateActiveStep);
    };
  }, []);

  const FactorAccordion = ({
    id,
    title,
    definition,
    items,
    footer,
  }: {
    id: FactorId;
    title: string;
    definition: React.ReactNode;
    items: React.ReactNode[];
    footer?: React.ReactNode;
  }) => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => toggleFactor(id)}
        className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition-colors"
      >
        <h3 className="text-sm sm:text-base font-semibold text-calcularq-blue">{title}</h3>
        {expandedFactors[id] ? (
          <ChevronUp className="w-4 h-4 text-calcularq-blue shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-calcularq-blue shrink-0" />
        )}
      </button>
      {expandedFactors[id] ? (
        <div className="border-t border-slate-200 px-4 py-4">
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-4">{definition}</p>
          <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 leading-relaxed">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-calcularq-blue shrink-0" />
                <div>{item}</div>
              </li>
            ))}
          </ul>
          {footer ? <div className="mt-4">{footer}</div> : null}
        </div>
      ) : null}
    </div>
  );

  const renderManualStepper = () => (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm backdrop-blur-sm">
      <div className="overflow-x-auto">
        <div className="mx-auto flex min-w-max items-start justify-center gap-2 sm:gap-3 px-1">
          {manualSteps.map((step, index) => {
            const isActive = activeStepId === step.id;
            const isCompleted = index < activeStepIndex;
            const circleLabel = step.id === "introducao" ? "I" : step.id === "encerramento" ? "F" : String(index);

            return (
              <div key={step.id} className="flex items-start gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection(step.id)}
                  className="group flex min-w-[92px] lg:min-w-[108px] flex-col items-center gap-2 rounded-xl px-1 py-1 text-center"
                  aria-current={isActive ? "step" : undefined}
                >
                  <span
                    className={[
                      "inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                      isActive
                        ? "border-calcularq-blue bg-calcularq-blue text-white"
                        : isCompleted
                          ? "border-calcularq-blue bg-calcularq-blue/10 text-calcularq-blue"
                          : "border-slate-300 bg-white text-slate-500 group-hover:border-calcularq-blue/40 group-hover:text-calcularq-blue",
                    ].join(" ")}
                  >
                    {isCompleted ? "✓" : circleLabel}
                  </span>
                  <span
                    className={[
                      "text-[11px] sm:text-xs leading-snug max-w-[11ch]",
                      isActive ? "text-calcularq-blue font-semibold" : "text-slate-600",
                    ].join(" ")}
                    style={{ textWrap: "balance" }}
                  >
                    {step.short}
                  </span>
                </button>

                {index < manualSteps.length - 1 ? (
                  <span
                    className={[
                      "mt-5 block h-[2px] w-5 sm:w-8 lg:w-10 rounded-full",
                      index < activeStepIndex ? "bg-calcularq-blue" : "bg-slate-300",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8 max-w-4xl mx-auto">
          <ManualCard className="p-6 sm:p-8 lg:p-10">
            <div id="introducao" className="text-center scroll-mt-24">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-calcularq-blue mb-5">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-calcularq-blue tracking-tight mb-4">
                Manual de Instruções
              </h1>
              <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto text-sm sm:text-base lg:text-lg">
                Bem-vindo à Calcularq, uma calculadora de precificação por complexidade. O sistema cruza o custo
                operacional do seu trabalho com o nível de complexidade de cada projeto para gerar um valor de referência
                mais coerente com o esforço técnico envolvido.
              </p>
              <p className="mt-4 text-slate-700 font-medium text-sm sm:text-base">
                Navegue pelas etapas abaixo para estudar o manual na mesma lógica da calculadora.
              </p>

            </div>
          </ManualCard>
        </motion.div>

        <div className="hidden md:block max-w-4xl mx-auto sticky top-20 z-20 mb-6 sm:mb-8">
          {renderManualStepper()}
        </div>

        <div className="md:hidden max-w-4xl mx-auto sticky top-20 z-20 mb-5">
          <details className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm p-3">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
              Sumário do manual
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </summary>
            <div className="mt-3 space-y-1.5">
              {manualSteps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => scrollToSection(step.id)}
                  className={[
                    "w-full text-left rounded-lg px-3 py-2 text-sm leading-snug",
                    activeStepId === step.id
                      ? "bg-calcularq-blue/5 text-calcularq-blue"
                      : "text-slate-600 hover:bg-slate-50 hover:text-calcularq-blue",
                  ].join(" ")}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </details>
        </div>

        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <ManualCard>
                <div id="etapa-1" className="scroll-mt-24">
                  <SectionHeader
                    icon={<Calculator className="w-5 h-5 text-calcularq-blue" />}
                    title="1. Definição da hora técnica mínima"
                    description="A primeira etapa define o custo real da sua hora de trabalho. Aqui nasce a referência mínima para o escritório operar sem prejuízo."
                    compact
                  />

                  <div className="grid gap-4">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> Você informa despesas fixas, pró-labore mínimo e horas produtivas mensais. O sistema calcula a Hora Técnica Mínima.
                    </NoteBox>

                    <div className="space-y-4 text-slate-700 leading-relaxed">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">O que você precisa preencher</h3>
                        <ul className="space-y-3">
                          <li>
                            <strong>Despesas fixas mensais:</strong> adicione os custos recorrentes para manter o escritório funcionando.
                            <p className="text-sm text-slate-500 mt-1">Ex.: aluguel, softwares, salários, contador, anuidades e serviços essenciais.</p>
                          </li>
                          <li>
                            <strong>Pró-labore mínimo:</strong> valor mensal líquido essencial para cobrir suas despesas pessoais.
                            <p className="text-sm text-amber-700 mt-1">Atenção: o lucro tende a aparecer na etapa final, via complexidade, horas e composição do preço.</p>
                          </li>
                          <li>
                            <strong>Horas produtivas mensais:</strong> horas efetivas dedicadas à produção de projeto (não o expediente inteiro).
                            <p className="text-sm text-calcularq-blue mt-1">Dica: muitas operações trabalham com algo entre 70% e 80% do tempo total como horas produtivas.</p>
                          </li>
                        </ul>
                      </div>

                      <NoteBox>
                        <strong>Resultado esperado:</strong> a calculadora define sua Hora Técnica Mínima. Esse valor será usado nas próximas etapas como base para o cálculo do preço.
                      </NoteBox>
                    </div>
                  </div>
                </div>
              </ManualCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <ManualCard>
                <div id="etapa-2" className="scroll-mt-24">
                  <SectionHeader
                    icon={<Settings2 className="w-5 h-5 text-calcularq-blue" />}
                    title="2. Calibragem dos pesos"
                    description="Etapa opcional. Ajuste a influência de cada fator de complexidade para refletir melhor a estratégia do seu escritório."
                    compact
                  />

                  <div className="space-y-4 text-slate-700 leading-relaxed">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> se você está começando, mantenha os pesos padrão (1) e avance. A etapa existe para calibrar o comportamento do cálculo, não para travar seu uso.
                    </NoteBox>

                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Como os pesos funcionam (0 a 6)</h3>
                      <p>
                        Cada peso define o quanto um fator de complexidade impacta o cálculo final. Quanto maior o peso, maior a influência daquele critério na composição da complexidade global.
                      </p>
                    </div>

                    <ul className="space-y-3">
                      <li>
                        <strong>Recomendação:</strong> comece com todos em <strong>Peso 1 (padrão)</strong> para manter uma referência equilibrada.
                      </li>
                      <li>
                        <strong>Quando alterar:</strong> aumente o peso quando um fator for sistematicamente mais relevante para o tipo de projeto que seu escritório atende.
                      </li>
                      <li>
                        <strong>Exemplo:</strong> se seu escritório trabalha com interiores de alto detalhamento, você pode elevar o peso do fator <em>Nível de detalhamento</em>.
                      </li>
                    </ul>
                  </div>
                </div>
              </ManualCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <ManualCard>
                <div id="etapa-3" className="scroll-mt-24">
                  <SectionHeader
                    icon={<Layers className="w-5 h-5 text-calcularq-blue" />}
                    title="3. Análise dos Fatores de Complexidade"
                    description="Classifique os fatores do projeto em uma escala de 1 a 5. A calculadora cruza essas informações para formar a complexidade global."
                    compact
                  />

                  <div className="space-y-4">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> aqui você informa área, etapa, detalhamento, exigência técnica, exigência burocrática e dedicação à obra. Esses fatores medem esforço e risco técnico.
                    </NoteBox>

                    <div className="space-y-3">
                      <FactorAccordion
                        id="area"
                        title="1. Área de projeto (m²)"
                        definition={<><strong>Definição:</strong> estimativa da metragem total de intervenção. Mede a escala física do projeto e impacta diretamente o volume de trabalho.</>}
                        items={[
                          <><strong>1. Até 49 m²:</strong> intervenções pontuais e rápidas, como reformas de cômodos ou consultorias.</>,
                          <><strong>2. 50 a 149 m²:</strong> faixa comum em apartamentos completos, casas compactas, lojas e pequenos escritórios.</>,
                          <><strong>3. 150 a 499 m²:</strong> projetos de porte robusto, como casas maiores e espaços comerciais mais amplos.</>,
                          <><strong>4. 500 a 999 m²:</strong> edificações de porte significativo e maior volume de compatibilização.</>,
                          <><strong>5. Acima de 1000 m²:</strong> grandes volumes e programas complexos, incluindo usos institucionais.</>,
                        ]}
                        footer={
                          <div className="rounded-xl border border-calcularq-blue/20 bg-calcularq-blue/5 px-4 py-3 text-sm leading-relaxed text-calcularq-blue">
                            Os intervalos são configuráveis. Você pode ajustá-los para a realidade do seu mercado.
                          </div>
                        }
                      />

                      <FactorAccordion
                        id="stage"
                        title="2. Etapa de projeto"
                        definition={<><strong>Definição:</strong> define até qual fase do ciclo de desenvolvimento o escritório entregará o projeto.</>}
                        items={[
                          <><strong>1. Consultoria:</strong> diagnósticos, visitas técnicas e direcionamento sem produção de projeto executivo.</>,
                          <><strong>2. Estudo preliminar:</strong> concepção visual, layout e validação funcional (ainda não é material para execução).</>,
                          <><strong>3. Anteprojeto:</strong> define tecnicamente o partido e permite aprovações/orçamentos preliminares.</>,
                          <><strong>4. Projeto executivo:</strong> caderno técnico final para execução da arquitetura.</>,
                          <><strong>5. Coordenação de complementares:</strong> inclui compatibilização com estrutura, instalações e demais disciplinas.</>,
                        ]}
                      />

                      <FactorAccordion
                        id="detail"
                        title="3. Nível de detalhamento"
                        definition={<><strong>Definição:</strong> mede a quantidade de desenhos e o esforço criativo/técnico exigido pela solução.</>}
                        items={[
                          <><strong>1. Mínimo:</strong> diretrizes gerais e baixa necessidade de detalhamento técnico.</>,
                          <><strong>2. Básico:</strong> soluções padronizadas e predominância de itens de catálogo.</>,
                          <><strong>3. Médio:</strong> combinação de itens convencionais com desenho sob medida moderado.</>,
                          <><strong>4. Alto:</strong> personalização ampla, com maior volume de detalhamento e coordenação.</>,
                          <><strong>5. Máximo:</strong> design autoral/atípico, com alto esforço criativo e detalhamento exaustivo.</>,
                        ]}
                      />

                      <FactorAccordion
                        id="technical"
                        title="4. Exigência técnica"
                        definition={<><strong>Definição:</strong> mede o rigor normativo e o volume de estudo técnico necessário para viabilizar o projeto.</>}
                        items={[
                          <><strong>1. Mínima:</strong> regras usuais do código local já dominadas pelo escritório.</>,
                          <><strong>2. Baixa:</strong> consultas pontuais a regulamentos específicos (ex.: condomínio).</>,
                          <><strong>3. Média:</strong> normas de segurança/acessibilidade e exigências recorrentes de aprovação.</>,
                          <><strong>4. Alta:</strong> requisitos técnicos específicos da atividade (ex.: educação, bancos, varejo especializado).</>,
                          <><strong>5. Máxima:</strong> ambientes altamente regulados, como saúde, patrimônio ou exigências ambientais complexas.</>,
                        ]}
                      />

                      <FactorAccordion
                        id="bureaucratic"
                        title="5. Exigência burocrática"
                        definition={<><strong>Definição:</strong> mede a carga administrativa e o esforço de tramitação/aprovação junto a órgãos e entidades.</>}
                        items={[
                          <><strong>1. Mínima:</strong> formalização profissional básica (RRT/ART).</>,
                          <><strong>2. Baixa:</strong> trâmite principal em uma esfera (ex.: prefeitura).</>,
                          <><strong>3. Média:</strong> prefeitura + instâncias complementares (condomínio, bombeiros etc.).</>,
                          <><strong>4. Alta:</strong> múltiplos órgãos e processos paralelos (sanitária, concessionárias, trânsito etc.).</>,
                          <><strong>5. Máxima:</strong> processos longos e rigorosos (ambiental, patrimônio, EIV, entre outros).</>,
                        ]}
                      />

                      <FactorAccordion
                        id="monitoring"
                        title="6. Dedicação à obra"
                        definition={<><strong>Definição:</strong> frequência de visitas e nível de responsabilidade assumido durante a execução.</>}
                        items={[
                          <><strong>1. Levantamento:</strong> visita inicial para medir e iniciar projeto, sem retornos na obra.</>,
                          <><strong>2. Pontual:</strong> visitas estratégicas em marcos específicos.</>,
                          <><strong>3. Por etapas:</strong> checagens ao fim de fases de execução.</>,
                          <><strong>4. Acompanhamento:</strong> rotina periódica de fiscalização e alinhamento com obra.</>,
                          <><strong>5. Gestão:</strong> atuação intensa na execução, com maior responsabilidade e coordenação.</>,
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </ManualCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <ManualCard>
                <div id="etapa-4" className="scroll-mt-24">
                  <SectionHeader
                    icon={<DollarSign className="w-5 h-5 text-calcularq-blue" />}
                    title="4. Composição final do preço"
                    description="Nesta etapa você finaliza o cálculo: informa horas estimadas, despesas variáveis e desconto comercial para chegar ao preço de venda final."
                    compact
                  />

                  <div className="space-y-4 text-slate-700 leading-relaxed">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> a calculadora combina Hora Técnica Mínima + complexidade (com multiplicador comprimido) + horas do projeto + despesas variáveis + desconto.
                    </NoteBox>

                    <NoteBox>
                      <strong>Índice de Complexidade (C):</strong> é o resultado da etapa 3, formado pelos fatores e pelos pesos.
                      <br />
                      <strong>Multiplicador (M):</strong> é o valor usado no cálculo final após compressão suave do índice, com a fórmula <strong>M = C^0,90</strong>.
                    </NoteBox>

                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">O que você precisa preencher</h3>
                      <ul className="space-y-3">
                        <li>
                          <strong>Estimativa de horas de projeto:</strong> total de horas previstas para executar este trabalho.
                          <p className="text-sm text-slate-500 mt-1">Esse total é multiplicado pela Hora Técnica Ajustada para formar os honorários-base do projeto.</p>
                        </li>
                        <li>
                          <strong>Despesas variáveis:</strong> custos específicos deste contrato que serão repassados ao cliente.
                          <p className="text-sm text-slate-500 mt-1">Ex.: RRT/ART, deslocamentos, plotagens, taxas e custos logísticos.</p>
                        </li>
                        <li>
                          <strong>Desconto comercial:</strong> ajuste opcional aplicado sobre os honorários. A calculadora mostra o impacto desse desconto para apoiar uma negociação consciente.</li>
                      </ul>
                    </div>

                    <NoteBox tone="amber">
                      <strong>Faixa sugerida pelo CAU (2% a 11%):</strong> a tela de resultados mostra o percentual do honorário sobre o valor da obra e sinaliza quando o valor está fora da faixa sugerida, com alerta contextual (sem bloquear o cálculo).
                    </NoteBox>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <h3 className="font-semibold text-calcularq-blue mb-3">Resultado apresentado ao final</h3>
                      <ul className="space-y-2 text-sm sm:text-base text-slate-700 leading-relaxed">
                        <li>• Hora Técnica Mínima</li>
                        <li>• Complexidade Global</li>
                        <li>• Hora Técnica Ajustada</li>
                        <li>• Estimativa de Horas de Projeto</li>
                        <li>• Preço do Projeto (honorários)</li>
                        <li>• Despesas Variáveis</li>
                        <li>• Valor do Desconto (se houver)</li>
                        <li>• Preço de Venda Final</li>
                        <li>• % do valor da obra (com referência CAU)</li>
                        <li>• Lucro Estimado</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ManualCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <section id="encerramento" className="scroll-mt-24 rounded-2xl bg-gradient-to-br from-calcularq-blue to-[#002366] p-6 sm:p-8 text-white shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-6 h-6 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Agora você está no controle</h2>
                  </div>
                </div>

                <div className="space-y-3 text-white/95 leading-relaxed text-sm sm:text-base">
                  <p>
                    O manual existe para reduzir incerteza e transformar a lógica da calculadora em um processo claro de decisão. O sistema entrega referência matemática; sua apresentação e estratégia comercial continuam sendo decisivas.
                  </p>
                  <p>
                    Use o manual para entender a lógica das etapas, depois aplique no fluxo real da calculadora. Se precisar, ajuste os pesos e os fatores conforme a realidade do seu escritório.
                  </p>
                  <p>
                    Revise horas estimadas, confira o impacto do desconto e use os resultados como apoio técnico para negociar com mais segurança.
                  </p>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <p className="font-semibold">Bom projeto!</p>
                  <Link to={createPageUrl("Calculator")}>
                    <Button className="bg-white text-calcularq-blue hover:bg-slate-100">
                      Ir para a calculadora
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </section>
            </motion.div>
          </div>
        </div>
      </div>
  );
}
