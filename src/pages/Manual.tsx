import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Calculator,
  Layers,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import SectionHeader from "@/components/calculator/SectionHeader";
import { ManualCard, NoteBox } from "@/components/manual/ManualCard";
import ManualStepper from "@/components/manual/ManualStepper";
import ManualMobileSummary from "@/components/manual/ManualMobileSummary";
import { createPageUrl } from "@/utils";
import { fadeUp } from "@/lib/motion";

type FactorId = "volume" | "typology" | "stage" | "detail" | "technical" | "bureaucratic" | "monitoring";
type Step1FieldId = "expenses" | "personal" | "hours";
type Step3FieldId = "hoursEstimate" | "variableExpenses" | "commercialDiscount";

const manualSteps = [
  { id: "introducao", label: "Visão geral", short: "Introdução" },
  { id: "etapa-1", label: "Hora técnica mínima", short: "Hora técnica mínima" },
  { id: "etapa-2", label: "Fatores de complexidade", short: "Fatores de complexidade" },
  { id: "etapa-3", label: "Composição final do preço", short: "Composição final" },
  { id: "encerramento", label: "Conclusão", short: "Conclusão" },
] as const;

const MANUAL_SCROLL_OFFSET = {
  mobile: 132,
  desktop: 92,
} as const;

const MANUAL_SCROLL_SPY_TOP = {
  mobile: 132,
  desktop: 240,
} as const;

export default function Manual() {
  const prefersReducedMotion = !!useReducedMotion();
  const [activeStepId, setActiveStepId] = useState<(typeof manualSteps)[number]["id"]>("introducao");
  const mobileSummaryRef = useRef<HTMLDetailsElement | null>(null);
  const [expandedFactors, setExpandedFactors] = useState<Record<FactorId, boolean>>({
    volume: true,
    typology: false,
    stage: false,
    detail: false,
    technical: false,
    bureaucratic: false,
    monitoring: false,
  });

  const [expandedFields, setExpandedFields] = useState<Record<Step1FieldId, boolean>>({
    expenses: true,
    personal: false,
    hours: false,
  });

  const [expandedStep3Fields, setExpandedStep3Fields] = useState<Record<Step3FieldId, boolean>>({
    hoursEstimate: true,
    variableExpenses: false,
    commercialDiscount: false,
  });

  const toggleFactor = (factorId: FactorId) => {
    setExpandedFactors((prev) => ({
      ...prev,
      [factorId]: !prev[factorId],
    }));
  };

  const toggleField = (fieldId: Step1FieldId) => {
    setExpandedFields((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const toggleStep3Field = (fieldId: Step3FieldId) => {
    setExpandedStep3Fields((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
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
      const offset = isMobile ? MANUAL_SCROLL_OFFSET.mobile : MANUAL_SCROLL_OFFSET.desktop;
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
      const isMobile = window.innerWidth < 768;
      const stickyTop = isMobile ? MANUAL_SCROLL_SPY_TOP.mobile : MANUAL_SCROLL_SPY_TOP.desktop;
      const viewportHeight = window.innerHeight;
      const viewportBottom = viewportHeight - (isMobile ? 20 : 32);

      let bestStep: (typeof manualSteps)[number]["id"] = manualSteps[0].id;
      let bestVisible = 0;

      for (const step of manualSteps) {
        const anchor = document.getElementById(step.id);
        if (!anchor) continue;
        const container = (anchor.closest("section") as HTMLElement | null) ?? anchor;
        const rect = container.getBoundingClientRect();
        const visibleTop = Math.max(rect.top, stickyTop);
        const visibleBottom = Math.min(rect.bottom, viewportBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        if (visibleHeight > bestVisible) {
          bestVisible = visibleHeight;
          bestStep = step.id;
        }
      }

      if (bestVisible > 0) {
        setActiveStepId(bestStep);
        return;
      }

      // Fallback: quando nenhuma seção está visível o suficiente, usa a mais próxima do topo útil.
      let fallback: (typeof manualSteps)[number]["id"] = manualSteps[0].id;
      for (const step of manualSteps) {
        const el = document.getElementById(step.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= stickyTop) fallback = step.id;
      }
      setActiveStepId(fallback);
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
        type="button"
        onClick={() => toggleFactor(id)}
        className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 min-h-[44px] text-left hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calcularq-blue/40 focus-visible:ring-offset-1"
        aria-expanded={expandedFactors[id]}
        aria-controls={`${id}-panel`}
        id={`${id}-trigger`}
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
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-trigger`}
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

  const Step1FieldAccordion = ({
    id,
    title,
    description,
    hint,
  }: {
    id: Step1FieldId;
    title: string;
    description: React.ReactNode;
    hint?: React.ReactNode;
  }) => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => toggleField(id)}
        className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 min-h-[44px] text-left hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calcularq-blue/40 focus-visible:ring-offset-1"
        aria-expanded={expandedFields[id]}
        aria-controls={`field-${id}-panel`}
        id={`field-${id}-trigger`}
      >
        <h3 className="text-sm sm:text-base font-semibold text-calcularq-blue">{title}</h3>
        {expandedFields[id] ? (
          <ChevronUp className="w-4 h-4 text-calcularq-blue shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-calcularq-blue shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {expandedFields[id] ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.18 }}
            className="overflow-hidden"
            id={`field-${id}-panel`}
            role="region"
            aria-labelledby={`field-${id}-trigger`}
          >
            <div className="border-t border-slate-200 px-4 py-4 space-y-2">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{description}</p>
              {hint ? <div>{hint}</div> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  const Step3FieldAccordion = ({
    id,
    title,
    description,
    hint,
  }: {
    id: Step3FieldId;
    title: string;
    description: React.ReactNode;
    hint?: React.ReactNode;
  }) => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => toggleStep3Field(id)}
        className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 min-h-[44px] text-left hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calcularq-blue/40 focus-visible:ring-offset-1"
        aria-expanded={expandedStep3Fields[id]}
        aria-controls={`step3-${id}-panel`}
        id={`step3-${id}-trigger`}
      >
        <h3 className="text-sm sm:text-base font-semibold text-calcularq-blue">{title}</h3>
        {expandedStep3Fields[id] ? (
          <ChevronUp className="w-4 h-4 text-calcularq-blue shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-calcularq-blue shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {expandedStep3Fields[id] ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.18 }}
            className="overflow-hidden"
            id={`step3-${id}-panel`}
            role="region"
            aria-labelledby={`step3-${id}-trigger`}
          >
            <div className="border-t border-slate-200 px-4 py-4 space-y-2">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{description}</p>
              {hint ? <div>{hint}</div> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <motion.div variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" className="mb-6 sm:mb-8 max-w-4xl mx-auto">
          <ManualCard className="p-6 sm:p-8 lg:p-10">
            <div id="introducao" className="text-center scroll-mt-[136px] md:scroll-mt-[96px]">
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

              <div className="mt-5 text-left">
                <NoteBox>
                  <strong>Método em construção:</strong> A Calcularq está numa fase de estruturação do seu método final. Os parâmetros atuais foram calibrados com base em referências técnicas e serão refinados continuamente a partir do feedback real dos usuários.
                </NoteBox>
              </div>

            </div>
          </ManualCard>
        </motion.div>

        <div className="hidden md:block max-w-4xl mx-auto sticky top-20 z-20 mb-6 sm:mb-8">
          <ManualStepper
            steps={manualSteps}
            activeStepId={activeStepId}
            activeStepIndex={activeStepIndex}
            onStepClick={(id) => scrollToSection(id as (typeof manualSteps)[number]["id"])}
          />
        </div>

        <div className="md:hidden max-w-4xl mx-auto sticky top-20 z-20 mb-5">
          <ManualMobileSummary
            summaryRef={mobileSummaryRef}
            steps={manualSteps}
            activeStepId={activeStepId}
            activeStepIndex={activeStepIndex}
            activeStepShort={activeManualStep.short}
            showsCurrentStep={mobileSummaryShowsCurrentStep}
            onStepClick={(id) => scrollToSection(id as (typeof manualSteps)[number]["id"])}
          />
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-5 sm:gap-6">
            <motion.div className="order-1" variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" transition={{ delay: prefersReducedMotion ? 0 : 0.03 }}>
              <ManualCard>
                <div id="etapa-1" className="scroll-mt-[136px] md:scroll-mt-[96px]">
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
                      <h3 className="text-base font-semibold text-calcularq-blue mb-2">O que você precisa preencher</h3>
                      <div className="space-y-3">
                        <Step1FieldAccordion
                          id="expenses"
                          title="Despesas operacionais fixas"
                          description="Os custos recorrentes mensais para manter seu escritório funcionando: aluguel, softwares, salários, contador, anuidades profissionais e serviços essenciais."
                        />
                        <Step1FieldAccordion
                          id="personal"
                          title="Despesas pessoais essenciais"
                          description="O valor mensal necessário para cobrir suas despesas pessoais essenciais. Não é a retirada desejada nem o lucro do projeto."
                          hint={<p className="text-sm text-amber-700">Atenção: o lucro tende a aparecer na etapa final, via complexidade, horas e composição do preço.</p>}
                        />
                        <Step1FieldAccordion
                          id="hours"
                          title="Horas produtivas mensais"
                          description="Horas efetivas dedicadas à produção de projeto (não o expediente inteiro)."
                          hint={<p className="text-sm text-calcularq-blue">Dica: muitas operações trabalham com algo entre 70% e 80% do tempo total como horas produtivas.</p>}
                        />
                      </div>

                      <NoteBox>
                        <strong>Resultado esperado:</strong> A calculadora define sua Hora Técnica Mínima. Esse valor será usado nas próximas etapas como base para o cálculo do preço.
                      </NoteBox>
                    </div>
                  </div>
                </div>
              </ManualCard>
            </motion.div>

            <motion.div className="order-2" variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" transition={{ delay: prefersReducedMotion ? 0 : 0.05 }}>
              <ManualCard>
                <div id="etapa-2" className="scroll-mt-[136px] md:scroll-mt-[96px]">
                  <SectionHeader
                    icon={<Layers className="w-5 h-5 text-calcularq-blue" />}
                    title="2. Fatores de complexidade"
                    description="Descreva o projeto: tamanho, etapa, detalhamento, exigências e dedicação à obra. A calculadora transforma isso em um índice de complexidade."
                    compact
                  />

                  <div className="space-y-4">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> Aqui você descreve o projeto em 7 fatores. O sistema transforma essas escolhas em um índice de complexidade.
                    </NoteBox>

                    <div className="space-y-3">
                      <FactorAccordion
                        id="volume"
                        title="1. Volume do Projeto"
                        definition={<><strong>Definição:</strong> Reúne a área total de intervenção em m² e o número de pavimentos do projeto. Considere apenas a metragem e níveis efetivamente projetados.</>}
                        items={[
                          <>
                            <strong>Área (m²):</strong>
                            <ul className="mt-1 ml-4 space-y-1 list-disc text-sm">
                              <li>Informe a metragem total de intervenção — não necessariamente a área do imóvel inteiro.</li>
                              <li>Em reformas parciais, use apenas a área que será de fato projetada.</li>
                            </ul>
                          </>,
                          <>
                            <strong>Níveis do projeto:</strong>
                            <ul className="mt-1 ml-4 space-y-1 list-disc text-sm">
                              <li><strong>1 nível (plano):</strong> projeto térreo ou unidade única em edifício existente.</li>
                              <li><strong>2–3 níveis:</strong> sobrado ou pequeno edifício.</li>
                              <li><strong>4–6 níveis:</strong> edifício médio com repetição de pavimentos.</li>
                              <li><strong>7–15 níveis:</strong> edifício alto.</li>
                              <li><strong>16+ níveis:</strong> edifício muito alto.</li>
                            </ul>
                          </>,
                        ]}
                        footer={
                          <div className="rounded-xl border border-calcularq-blue/20 bg-calcularq-blue/5 px-4 py-3 text-sm leading-relaxed text-calcularq-blue">
                            Em reforma de apartamento, o volume é o da unidade efetivamente projetada — não do edifício inteiro.
                          </div>
                        }
                      />

                      <FactorAccordion
                        id="typology"
                        title="2. Tipologia"
                        definition={<><strong>Definição:</strong> Natureza principal do projeto arquitetônico. Em projetos mistos, considere o uso predominante.</>}
                        items={[
                          <><strong>Residencial:</strong> casas, apartamentos e habitações em geral.</>,
                          <><strong>Comercial / Serviços:</strong> lojas, escritórios, galpões e espaços de armazenamento simples.</>,
                          <><strong>Institucional:</strong> escolas, sedes públicas, equipamentos culturais e similares.</>,
                          <><strong>Industrial:</strong> projetos com layout de produção e exigências técnicas específicas de processo.</>,
                          <><strong>Saúde:</strong> clínicas, hospitais, salas limpas e projetos com requisitos ANVISA ou farmacêuticos.</>,
                        ]}
                        footer={
                          <div className="rounded-xl border border-calcularq-blue/20 bg-calcularq-blue/5 px-4 py-3 text-sm leading-relaxed text-calcularq-blue">
                            Reforma / Ampliação: marque quando o projeto envolver intervenção em edificação existente. Inclui reforma, ampliação, adaptação ou compatibilização com o existente.
                          </div>
                        }
                      />

                      <FactorAccordion
                        id="stage"
                        title="3. Etapa de projeto"
                        definition={<><strong>Definição:</strong> define até qual fase do ciclo de desenvolvimento o escritório entregará o projeto.</>}
                        items={[
                          <><strong>1. Consultoria:</strong> aconselhamento técnico, diagnósticos e direcionamento pontual, sem desenvolvimento de projetos.</>,
                          <><strong>2. Estudo preliminar:</strong> concepção visual, layout e validação funcional (ainda não é material para execução).</>,
                          <><strong>3. Anteprojeto:</strong> define tecnicamente o partido e permite aprovações/orçamentos preliminares.</>,
                          <><strong>4. Projeto executivo:</strong> caderno técnico final para execução da arquitetura.</>,
                          <><strong>5. Compatibilização de complementares:</strong> inclui compatibilização com estrutura, instalações e demais disciplinas.</>,
                        ]}
                      />

                      <FactorAccordion
                        id="detail"
                        title="4. Nível de detalhamento"
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
                        title="5. Exigência técnica"
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
                        title="6. Exigência burocrática"
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
                        title="7. Dedicação à obra"
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

            <motion.div className="order-3" variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" transition={{ delay: prefersReducedMotion ? 0 : 0.09 }}>
              <ManualCard>
                <div id="etapa-3" className="scroll-mt-[136px] md:scroll-mt-[96px]">
                  <SectionHeader
                    icon={<DollarSign className="w-5 h-5 text-calcularq-blue" />}
                    title="3. Composição final do preço"
                    description="A calculadora estimou as horas do projeto. Confira, ajuste se necessário e adicione despesas e condições comerciais."
                    compact
                  />

                  <div className="space-y-4 text-slate-700 leading-relaxed">
                    <NoteBox tone="slate">
                      <strong>Resumo rápido:</strong> A calculadora compõe o preço de venda final a partir da hora técnica do escritório e da complexidade estimada do projeto.
                    </NoteBox>

                    <div>
                      <h3 className="text-base font-semibold text-calcularq-blue mb-2">O que você encontra nesta etapa</h3>
                      <div className="space-y-3">
                        <Step3FieldAccordion
                          id="hoursEstimate"
                          title="Estimativa de horas de projeto"
                          description="A calculadora já preenche esse valor com a estimativa-base de horas do método. Você pode substituí-lo se preferir usar sua própria estimativa."
                          hint={<p className="text-sm text-slate-500">No cenário conservador, a margem de incerteza do método continua sendo aplicada sobre o valor informado. No cenário otimista, essa margem adicional não é aplicada.</p>}
                        />
                        <Step3FieldAccordion
                          id="variableExpenses"
                          title="Despesas variáveis"
                          description="Custos específicos deste contrato que serão repassados ao cliente."
                          hint={<p className="text-sm text-slate-500">Ex.: RRT/ART, deslocamentos, plotagens, taxas e custos logísticos.</p>}
                        />
                        <Step3FieldAccordion
                          id="commercialDiscount"
                          title="Desconto comercial"
                          description="Ajuste opcional aplicado sobre os honorários. A calculadora mostra o impacto desse desconto para apoiar uma negociação consciente."
                        />
                        <NoteBox tone="slate">
                          <strong>Margem de lucro e cenários:</strong> A margem de lucro é aplicada sobre a hora técnica mínima para compor a hora técnica ajustada, antes do prêmio por complexidade técnica. No cenário conservador, a calculadora aplica a margem de incerteza do método sobre a estimativa-base de horas. No cenário otimista, usa a estimativa-base sem essa margem adicional.
                        </NoteBox>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <h3 className="font-semibold text-calcularq-blue mb-3">Resultado apresentado ao final</h3>
                      <ul className="space-y-2 text-sm sm:text-base text-slate-700 leading-relaxed">
                        {[
                          "Score",
                          "Hora Técnica Ajustada",
                          "Estimativa de Horas de Projeto",
                          "Despesas Variáveis",
                          "Preço de Venda Final",
                          "Valor do Desconto (se houver)",
                          "Preço/m² (indicador comparativo)",
                          "Lucro estimado (margem bruta entre hora ajustada e hora mínima)",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-calcularq-blue/40 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <NoteBox>
                      <strong>Preço por m² (indicador comparativo):</strong> O indicador de preço por m² é apresentado como referência comparativa — não como parâmetro de mercado. O valor varia significativamente por região, padrão construtivo e complexidade. Use-o para ganhar perspectiva, não como critério de aprovação.
                    </NoteBox>
                  </div>
                </div>
              </ManualCard>
            </motion.div>

            <motion.div className="order-4" variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" transition={{ delay: prefersReducedMotion ? 0 : 0.11 }}>
              <section id="encerramento" className="relative scroll-mt-[136px] md:scroll-mt-[96px] overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-calcularq-blue via-[#002366] to-calcularq-blue p-6 sm:p-8 text-white shadow-sm">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-xl" />

                <div className="relative flex items-start gap-3 mb-4">
                  <Info className="w-6 h-6 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Você tem uma referência. O próximo passo é seu.</h2>
                  </div>
                </div>

                <div className="relative space-y-3 text-white/95 leading-relaxed text-sm sm:text-base">
                  <p>
                    A calculadora entrega estrutura: uma estimativa de esforço, uma composição de custo e uma referência de preço baseadas nos dados do projeto. O que ela não entrega é o julgamento — sobre o cliente, o mercado e o momento. Isso é seu.
                  </p>
                  <p>
                    <strong>Método em construção:</strong> A Calcularq está numa fase de estruturação do seu método final. Os parâmetros atuais foram calibrados com base em referências técnicas e serão refinados continuamente a partir do feedback real dos usuários.
                  </p>
                </div>

                <div className="relative mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                  <Link
                    to={createPageUrl("Calculator")}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-calcularq-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-calcularq-blue hover:bg-slate-100"
                  >
                    <span>Ir para a calculadora</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </section>
            </motion.div>
          </div>
        </div>
      </div>
  );
}


