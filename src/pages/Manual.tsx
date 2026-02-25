import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { fadeUp } from "@/lib/motion";

type FactorId = "area" | "stage" | "detail" | "technical" | "bureaucratic" | "monitoring";

const manualSteps = [
  { id: "introducao", label: "Visão geral", short: "Introdução" },
  { id: "etapa-1", label: "Hora técnica mínima", short: "Hora técnica mínima" },
  { id: "etapa-2", label: "Fatores de complexidade", short: "Fatores de complexidade" },
  { id: "etapa-3", label: "Calibragem dos pesos", short: "Calibragem dos pesos" },
  { id: "etapa-4", label: "Composição final do preço", short: "Composição final" },
  { id: "encerramento", label: "Conclusão", short: "Conclusão" },
] as const;

function ManualCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 ${className}`.trim()}>
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
        : "border-blue-200 bg-blue-50/70 text-blue-800";

  return <div className={`rounded-xl border px-4 py-3 leading-relaxed ${toneClass}`}>{children}</div>;
}

export default function Manual() {
  const prefersReducedMotion = !!useReducedMotion();
  const [activeStepId, setActiveStepId] = useState<(typeof manualSteps)[number]["id"]>("introducao");
  const mobileSummaryRef = useRef<HTMLDetailsElement | null>(null);
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
  const activeManualStep = manualSteps[activeStepIndex] ?? manualSteps[0];
  const mobileSummaryShowsCurrentStep = activeManualStep.id !== "introducao";

  const scrollToSection = (id: (typeof manualSteps)[number]["id"]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const sectionAnchor = (el.closest("section") as HTMLElement | null) ?? el;

    const isMobile = window.innerWidth < 768;
    const summaryWasOpen = isMobile && Boolean(mobileSummaryRef.current?.open);

    if (summaryWasOpen && mobileSummaryRef.current) {
      mobileSummaryRef.current.open = false;
    }

    const performScroll = () => {
      const offset = isMobile ? 132 : 92;
      const top = sectionAnchor.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    };

    if (summaryWasOpen) {
      requestAnimationFrame(() => requestAnimationFrame(performScroll));
      return;
    }

    performScroll();
  };

  useEffect(() => {
    const updateActiveStep = () => {
      let current: (typeof manualSteps)[number]["id"] = manualSteps[0].id;
      // Troca a etapa um pouco antes do topo da próxima seção para evitar sensação de atraso
      // quando há elementos sticky (navbar + stepper/sumário) cobrindo parte do conteúdo.
      const triggerLine = window.innerWidth < 768 ? 132 : 240;
      for (const step of manualSteps) {
        const el = document.getElementById(step.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= triggerLine) current = step.id;
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
      <AnimatePresence initial={false}>
        {expandedFactors[id] ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.18 }}
            className="overflow-hidden"
          >
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  const renderManualStepper = () => (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm backdrop-blur-sm">
      <div className="px-1">
        <div className="mx-auto flex w-full items-start justify-between gap-1 sm:gap-2">
          {manualSteps.map((step, index) => {
            const isActive = activeStepId === step.id;
            const isCompleted = index < activeStepIndex;
            const circleLabel = step.id === "introducao" ? "I" : step.id === "encerramento" ? "C" : String(index);

            return (
              <div key={step.id} className="flex min-w-0 flex-1 items-start">
                <button
                  type="button"
                  onClick={() => scrollToSection(step.id)}
                  className="group flex w-full min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-1 text-center"
                  aria-current={isActive ? "step" : undefined}
                >
                  <span
                    className={[
                      "inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors transition-shadow duration-200",
                      isCompleted
                        ? "border-calcularq-blue bg-calcularq-blue text-white shadow-md"
                        : isActive
                          ? "border-calcularq-blue bg-white text-calcularq-blue shadow-sm"
                          : "border-slate-200 bg-white text-slate-400 group-hover:border-calcularq-blue/40 group-hover:text-calcularq-blue",
                    ].join(" ")}
                  >
                    {isCompleted ? "✓" : circleLabel}
                  </span>
                  <span
                    className={[
                      "text-[11px] sm:text-xs leading-snug max-w-full",
                      isCompleted || isActive ? "text-calcularq-blue font-semibold" : "text-slate-400",
                    ].join(" ")}
                    style={{ textWrap: "balance" }}
                  >
                    {step.short}
                  </span>
                </button>

                {index < manualSteps.length - 1 ? (
                  <span
                    className={[
                      "mt-5 mx-1 sm:mx-2 block h-[2px] flex-1 min-w-2 rounded-full",
                      index < activeStepIndex ? "bg-calcularq-blue" : "bg-slate-200",
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
        <motion.div variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" className="mb-6 sm:mb-8 max-w-4xl mx-auto">
          <ManualCard className="p-6 sm:p-8 lg:p-10">
            <div id="introducao" className="text-center scroll-mt-24">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-calcularq-blue mb-5">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-calcularq-blue tracking-tight mb-4">
                Manual de Instruções
              </h1>
              <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto text-sm sm:text-base lg:text-lg">
                A Calcularq precifica projetos de arquitetura pelo esforço real. Ela cruza o custo da sua hora de
                trabalho com a complexidade do projeto para gerar um preço justo e defendável.
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
          <details ref={mobileSummaryRef} className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm p-3">
            <summary
              className={[
                "cursor-pointer list-none flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                mobileSummaryShowsCurrentStep
                  ? "bg-calcularq-blue/5 text-calcularq-blue"
                  : "text-slate-900 hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="min-w-0 truncate">
                {mobileSummaryShowsCurrentStep ? activeManualStep.short : "Sumário do manual"}
              </span>
              <ChevronDown className={["w-4 h-4", mobileSummaryShowsCurrentStep ? "text-calcularq-blue" : "text-slate-500"].join(" ")} />
            </summary>
            <div className="mt-3 space-y-1.5">
              {manualSteps.map((step, index) => {
                const isActive = activeStepId === step.id;
                const isCompleted = index < activeStepIndex;
                const badgeLabel = step.id === "introducao" ? "I" : step.id === "encerramento" ? "C" : String(index);

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => scrollToSection(step.id)}
                    className={[
                      "w-full text-left rounded-lg px-3 py-2 text-sm leading-snug transition-colors",
                      isActive
                        ? "bg-calcularq-blue/5 text-calcularq-blue"
                        : isCompleted
                          ? "bg-calcularq-blue/[0.03] text-calcularq-blue"
                          : "text-slate-600 hover:bg-slate-50 hover:text-calcularq-blue",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={[
                          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                          isCompleted
                            ? "border-calcularq-blue bg-calcularq-blue text-white"
                            : isActive
                              ? "border-calcularq-blue bg-white text-calcularq-blue"
                              : "border-slate-200 bg-white text-slate-400",
                        ].join(" ")}
                      >
                        {isCompleted ? "✓" : badgeLabel}
                      </span>
                      <span className={isActive ? "font-semibold" : undefined}>{step.short}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </details>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-5 sm:gap-6">
            <motion.div className="order-1" variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" transition={{ delay: prefersReducedMotion ? 0 : 0.03 }}>
              <ManualCard>
                <div id="etapa-1" className="scroll-mt-24">
                  <SectionHeader
                    icon={<Calculator className="w-5 h-5 text-calcularq-blue" />}
                    title="1. Hora técnica mínima"
                    description="Quanto custa sua hora de trabalho? Aqui você descobre o mínimo para operar sem prejuízo."
                    compact
                  />

                  <div className="grid gap-4">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> Informe despesas operacionais fixas, despesas pessoais essenciais e horas produtivas. O sistema retorna sua Hora Técnica Mínima.
                    </NoteBox>

                    <div className="space-y-4 text-slate-700 leading-relaxed">
                      <div>
                        <h3 className="text-base font-semibold text-calcularq-blue mb-2">O que você precisa preencher</h3>
                        <ul className="space-y-3">
                          <li>
                            <strong>Despesas operacionais fixas (mensais):</strong> Adicione os custos recorrentes para manter o escritório funcionando.
                            <p className="text-sm text-slate-500 mt-1">Ex.: aluguel, softwares, salários, contador, anuidades e serviços essenciais.</p>
                          </li>
                          <li>
                            <strong>Despesas pessoais essenciais (mensais):</strong> Valor líquido essencial para cobrir suas despesas pessoais.
                            <p className="text-sm text-amber-700 mt-1">Atenção: o lucro tende a aparecer na etapa final, via complexidade, horas e composição do preço.</p>
                          </li>
                          <li>
                          <strong>Horas produtivas mensais:</strong> Horas efetivas dedicadas à produção de projeto (não o expediente inteiro).
                            <p className="text-sm text-calcularq-blue mt-1">Dica: muitas operações trabalham com algo entre 70% e 80% do tempo total como horas produtivas.</p>
                          </li>
                        </ul>
                      </div>

                      <NoteBox>
                        <strong>Resultado esperado:</strong> A calculadora define sua Hora Técnica Mínima. Esse valor será usado nas próximas etapas como base para o cálculo do preço.
                      </NoteBox>
                    </div>
                  </div>
                </div>
              </ManualCard>
            </motion.div>

            <motion.div className="order-3" variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" transition={{ delay: prefersReducedMotion ? 0 : 0.07 }}>
              <ManualCard>
                <div id="etapa-3" className="scroll-mt-24">
                  <SectionHeader
                    icon={<Settings2 className="w-5 h-5 text-calcularq-blue" />}
                    title="3. Calibragem dos pesos"
                    description="Etapa opcional. Ajuste a influência de cada fator de complexidade para refletir melhor a estratégia do seu escritório."
                    compact
                  />

                  <div className="space-y-4 text-slate-700 leading-relaxed">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> Ajuste os pesos se quiser calibrar o cálculo ao perfil do seu escritório. Se preferir, mantenha o padrão e avance.
                    </NoteBox>

                    <p className="text-sm text-calcularq-blue font-medium">
                      Primeira vez? Você pode pular esta etapa. Os pesos padrão funcionam bem para começar.
                    </p>

                    <div>
                      <h3 className="text-base font-semibold text-calcularq-blue mb-2">Como os pesos funcionam (0 a 6)</h3>
                      <p>
                        Cada peso define o quanto um fator de complexidade impacta o cálculo final. Quanto maior o peso, maior a influência daquele critério na composição da complexidade global.
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Peso 0 reduz a influência do fator; peso 6 dá influência máxima.
                      </p>
                    </div>

                    <ul className="space-y-3">
                      <li>
                        <strong>Recomendação:</strong> Comece com todos em <strong>Peso 1 (padrão)</strong> para manter uma referência equilibrada.
                      </li>
                      <li>
                        <strong>Quando alterar:</strong> Aumente o peso quando um fator for sistematicamente mais relevante para o tipo de projeto que seu escritório atende.
                      </li>
                      <li>
                        <strong>Exemplo:</strong> Se seu escritório trabalha com interiores de alto detalhamento, você pode elevar o peso do fator <em>Nível de detalhamento</em>.
                      </li>
                    </ul>
                  </div>
                </div>
              </ManualCard>
            </motion.div>

            <motion.div className="order-2" variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" transition={{ delay: prefersReducedMotion ? 0 : 0.05 }}>
              <ManualCard>
                <div id="etapa-2" className="scroll-mt-24">
                  <SectionHeader
                    icon={<Layers className="w-5 h-5 text-calcularq-blue" />}
                    title="2. Fatores de complexidade"
                    description="Descreva o projeto: tamanho, etapa, detalhamento, exigências e dedicação à obra. A calculadora transforma isso em um índice de complexidade."
                    compact
                  />

                  <div className="space-y-4">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> Aqui você descreve o projeto em 6 fatores. O sistema transforma essas escolhas em um índice de complexidade.
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
                          <><strong>1. Consultoria:</strong> aconselhamento técnico, diagnósticos e direcionamento pontual, sem desenvolvimento de projetos.</>,
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

            <motion.div className="order-4" variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" transition={{ delay: prefersReducedMotion ? 0 : 0.09 }}>
              <ManualCard>
                <div id="etapa-4" className="scroll-mt-24">
                  <SectionHeader
                    icon={<DollarSign className="w-5 h-5 text-calcularq-blue" />}
                    title="4. Composição final do preço"
                    description="Informe as horas estimadas, despesas do contrato e desconto comercial para chegar ao preço de venda."
                    compact
                  />

                  <div className="space-y-4 text-slate-700 leading-relaxed">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> Você informa horas, despesas variáveis e desconto comercial. A calculadora compõe o preço de venda final usando a complexidade do projeto com multiplicador comprimido ({`M = C^0,90`}).
                    </NoteBox>

                    <div>
                      <h3 className="text-base font-semibold text-calcularq-blue mb-2">O que você precisa preencher</h3>
                      <ul className="space-y-3">
                        <li>
                          <strong>Estimativa de horas de projeto:</strong> Total de horas previstas para executar este trabalho.
                          <p className="text-sm text-slate-500 mt-1">Considere a etapa, o tamanho e a complexidade do projeto. Esse total é multiplicado pela Hora Técnica Ajustada para formar os honorários-base do projeto.</p>
                        </li>
                        <li>
                          <strong>Despesas variáveis:</strong> Custos específicos deste contrato que serão repassados ao cliente.
                          <p className="text-sm text-slate-500 mt-1">Ex.: RRT/ART, deslocamentos, plotagens, taxas e custos logísticos.</p>
                        </li>
                        <li>
                          <strong>Desconto comercial:</strong> Ajuste opcional aplicado sobre os honorários. A calculadora mostra o impacto desse desconto para apoiar uma negociação consciente.</li>
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <h3 className="font-semibold text-calcularq-blue mb-3">Resultado apresentado ao final</h3>
                      <ul className="space-y-2 text-sm sm:text-base text-slate-700 leading-relaxed">
                        {[
                          "Hora Técnica Mínima",
                          "Complexidade Global",
                          "Hora Técnica Ajustada",
                          "Estimativa de Horas de Projeto",
                          "Preço do Projeto (honorários)",
                          "Despesas Variáveis",
                          "Valor do Desconto (se houver)",
                          "Preço de Venda Final",
                          "% do valor da obra (indicador comparativo, referência CAU)",
                          "Preço/m² (indicador comparativo, referência IAB/CAU)",
                          "Lucro Estimado",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-calcularq-blue/40 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <NoteBox>
                      <strong>% do valor da obra (referência CAU/BR):</strong> Indicador comparativo (faixa sugerida: 2% a 11%). A faixa de referência pode variar dependendo da complexidade, da etapa do projeto, do tipo de projeto, da sofisticação e da região. Ele ajuda a contextualizar o resultado, mas não define o cálculo.
                    </NoteBox>

                    <NoteBox>
                      <strong>Preço por m² (referência IAB/CAU):</strong> Indicador comparativo (faixa sugerida: R$ 60 a R$ 200/m² para projetos residenciais). A faixa de referência pode variar dependendo da complexidade, da etapa do projeto, da sofisticação, da área e da região. Ele ajuda a contextualizar o resultado, mas não define o cálculo.
                    </NoteBox>
                  </div>
                </div>
              </ManualCard>
            </motion.div>

            <motion.div className="order-5" variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" transition={{ delay: prefersReducedMotion ? 0 : 0.11 }}>
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
                    Use o manual para entender a lógica das etapas e aplicar o fluxo na calculadora. Os resultados são referência técnica; a negociação e a estratégia comercial continuam sendo suas.
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

