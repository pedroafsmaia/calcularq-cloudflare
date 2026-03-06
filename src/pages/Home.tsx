import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { ArrowRight, Calculator, CheckCircle2, Clock3, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";
import { fadeUp, listStagger, viewportOnce } from "@/lib/motion";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = !!useReducedMotion();

  useEffect(() => {
    if (user?.hasPaid) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://widget.senja.io/widget/5c4b77f9-c453-43c6-8dd1-8c015286d9e7/platform.js";
    script.type = "text/javascript";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src*="widget.senja.io"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [user?.hasPaid]);

  const handleCalculatorClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate(createPageUrl("Login"));
      return;
    }
    if (!user.hasPaid) {
      e.preventDefault();
      navigate(createPageUrl("Payment"));
    }
  };

  const features = [
    {
      icon: Calculator,
      title: "Precificação por complexidade",
      description: "Cada projeto é avaliado por fatores reais que influenciam o esforço de desenvolvimento.",
    },
    {
      icon: Clock3,
      title: "Estimativa de horas do projeto",
      description: "A calculadora sugere horas de trabalho com base na complexidade do projeto.",
    },
    {
      icon: DollarSign,
      title: "Preço baseado na sua hora técnica",
      description: "O valor final é calculado a partir da sua hora técnica e das horas estimadas.",
    },
  ];

  const demoCards = [
    {
      header: "SIMPLES",
      projectType: "Residencial",
      area: "80m²",
      stage: "Projeto executivo",
      score: "28/100",
      complexity: "Baixa",
      hours: "152h",
      price: "R$ 7.600",
      sqm: "R$ 95/m²",
    },
    {
      header: "MÉDIO",
      projectType: "Comercial",
      area: "150m²",
      stage: "Projeto executivo",
      score: "52/100",
      complexity: "Moderada",
      hours: "299h",
      price: "R$ 14.950",
      sqm: "R$ 100/m²",
    },
    {
      header: "COMPLEXO",
      projectType: "Saúde",
      area: "250m²",
      stage: "Projeto executivo",
      score: "76/100",
      complexity: "Alta",
      hours: "595h",
      price: "R$ 29.750",
      sqm: "R$ 119/m²",
    },
  ];

  const factorsList = [
    "Tipologia do projeto",
    "Etapa de projeto",
    "Nível de detalhamento",
    "Exigência técnica",
    "Exigência burocrática",
    "Dedicação à obra",
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden bg-gradient-to-b from-calcularq-blue via-calcularq-blue to-[#01265c]">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-white blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-20">
          <div className="relative z-10 mx-auto max-w-5xl">
            <div className="relative z-20 mx-auto mb-4 max-w-[21.5rem] px-2 sm:mb-5 sm:max-w-[24rem] lg:hidden">
              <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" animate="show" transition={{ delay: 0.12 }}>
                <img src="/mockup.png" alt="Interface da Calculadora Calcularq" className="h-auto w-full object-contain drop-shadow-2xl" />
              </motion.div>
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
              <div className="hidden lg:block">
                <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" animate="show" transition={{ delay: 0.12 }} className="px-2">
                  <img src="/mockup.png" alt="Interface da Calculadora Calcularq" className="h-auto w-full object-contain drop-shadow-2xl" />
                </motion.div>
              </div>

              <motion.div
                variants={fadeUp(prefersReducedMotion, 16)}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-white p-5 pt-10 shadow-2xl sm:p-8 sm:pt-12 lg:p-10 lg:pt-10"
              >
                <h1 className="mb-4 text-center text-[2.05rem] font-bold leading-[1.12] tracking-tight text-calcularq-blue sm:mb-5 sm:text-4xl lg:text-[2.5rem]">
                  SUA CALCULADORA DE PRECIFICAÇÃO POR COMPLEXIDADE
                </h1>

                <p className="mx-auto mb-6 max-w-[54ch] text-center text-[0.98rem] leading-relaxed text-slate-700 sm:mb-7 sm:text-lg">
                  Precifique seus projetos de arquitetura com inteligência. A Calcularq é uma ferramenta que evolui com você, alinhando seus cálculos à complexidade de cada projeto.
                </p>

                {!user?.hasPaid ? (
                  <div className="mb-4 flex items-center justify-center sm:mb-5">
                    <div
                      className="senja-embed"
                      data-id="5c4b77f9-c453-43c6-8dd1-8c015286d9e7"
                      data-mode="shadow"
                      data-lazyload="false"
                      style={{ display: "block", width: "100%", transform: "scale(1.2)", transformOrigin: "center", margin: "0 auto" }}
                    />
                  </div>
                ) : null}

                <Link to={user ? createPageUrl("Calculator") : createPageUrl("Login")} onClick={handleCalculatorClick} className="mb-2.5 block sm:mb-3">
                  <Button
                    size="lg"
                    className="w-full rounded-xl px-8 py-6 text-base font-semibold text-white shadow-md transition-shadow duration-150 hover:shadow-lg sm:text-lg"
                    style={{ backgroundColor: "#fc7338" }}
                  >
                    {user?.hasPaid ? "Acessar a Calcularq" : "Acessar a Calcularq - R$19,90"}
                  </Button>
                </Link>

                {user?.hasPaid ? (
                  <a href="https://senja.io/p/calcularq/r/GRdv6A" target="_blank" rel="noopener noreferrer" className="mb-3 block sm:mb-3.5">
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="w-full rounded-xl border-slate-200/90 px-8 py-6 text-base text-slate-600 shadow-sm hover:bg-slate-50 hover:text-calcularq-blue sm:text-lg"
                    >
                      Avalie a Calcularq
                    </Button>
                  </a>
                ) : null}

                <p className="text-center text-sm text-slate-600">Pagamento único. Sem mensalidades.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <motion.div variants={listStagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={fadeUp(prefersReducedMotion, 12)}
              transition={{ delay: prefersReducedMotion ? 0 : index * 0.03 }}
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-calcularq-blue via-[#002366] to-calcularq-blue p-6 text-center shadow-sm transition-colors transition-shadow duration-150 hover:border-white/40 hover:shadow-md"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -left-10 bottom-0 h-20 w-20 rounded-full bg-white/10 blur-xl" />

              <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="relative mx-auto mb-2 flex min-h-[3.2rem] max-w-[18ch] items-center justify-center px-1 text-base font-semibold leading-snug text-white sm:text-lg">
                {feature.title}
              </h3>
              <p className="relative mx-auto max-w-[31ch] px-1 text-sm leading-relaxed text-blue-100 sm:text-[0.95rem]">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div id="como-funciona" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" whileInView="show" viewport={viewportOnce} className="text-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-calcularq-blue sm:text-3xl lg:text-4xl">Como funciona</h2>
          <p className="mx-auto mb-12 max-w-[54ch] text-base leading-relaxed text-slate-700 sm:text-lg">
            Cada projeto tem sua complexidade. O Calcularq transforma isso em número, em três etapas simples.
          </p>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <HowStep
              number="1"
              title="Hora técnica"
              description="Informe suas despesas e horas de trabalho. O sistema calcula sua hora técnica mínima."
              showConnector
            />
            <HowStep
              number="2"
              title="Fatores de complexidade"
              description="Informe as características do projeto. O sistema estima as horas necessárias e premia a complexidade."
              showConnector
            />
            <HowStep
              number="3"
              title="Preço e ajustes"
              description="As horas estimadas são convertidas em preço com base na sua hora técnica ajustada."
            />
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <motion.div
          variants={fadeUp(prefersReducedMotion, 14)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="rounded-3xl bg-gradient-to-br from-calcularq-blue via-[#002366] to-calcularq-blue p-6 sm:p-8 md:p-12"
        >
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="text-center md:text-left">
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">Fatores de complexidade</h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-200 sm:text-base lg:text-lg">
                A Calcularq analisa seis fatores para medir a complexidade do projeto e ajustar as estimativas de horas e valor.
              </p>
              <Link to={createPageUrl("Calculator")} className="inline-block" onClick={handleCalculatorClick}>
                <Button className="border-2 border-white bg-white px-6 py-3 font-semibold text-calcularq-blue shadow-md transition-colors transition-shadow duration-150 hover:border-slate-200 hover:bg-slate-50 hover:shadow-lg">
                  Experimentar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {factorsList.map((factor) => (
                <div key={factor} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                  <span className="min-w-0 text-sm leading-snug text-white sm:text-[0.95rem]">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <motion.div
          variants={fadeUp(prefersReducedMotion, 14)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:p-10"
        >
          <h2 className="text-center text-2xl font-bold tracking-tight text-calcularq-blue sm:text-3xl">Exemplos de Precificação</h2>
          <p className="mt-3 text-center text-sm text-slate-600 sm:text-base">
            Cenários ilustrativos para mostrar como o método responde a diferentes níveis de complexidade.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demoCards.map((card) => (
              <div key={card.header} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold tracking-wide text-calcularq-blue">{card.header}</p>
                  <span className="rounded-full border border-calcularq-blue/20 bg-calcularq-blue/10 px-2 py-0.5 text-xs font-medium text-calcularq-blue">
                    Score {card.score}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  <p>{card.projectType}</p>
                  <p>{card.area}</p>
                  <p>{card.stage}</p>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Indicadores</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Horas</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{card.hours}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Valor total</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{card.price}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">R$/m²</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{card.sqm}</p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">Complexidade {card.complexity.toLowerCase()}.</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28">
        <motion.div
          variants={fadeUp(prefersReducedMotion, 14)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="rounded-3xl border border-calcularq-blue/25 bg-gradient-to-br from-calcularq-blue via-[#002d6f] to-[#001f4f] px-6 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14"
        >
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Uma calculadora que evolui com você</h2>
              <p className="max-w-[58ch] text-sm leading-relaxed text-blue-100 sm:text-base">
                A Calcularq aprende com a sua experiência. Ao registrar as horas reais dos seus projetos finalizados, o sistema ajusta automaticamente as estimativas futuras.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-blue-100 sm:text-base">Quanto mais você usa, mais precisa ela fica.</p>
            </div>

            <div className="grid gap-3">
              {["Registre suas horas reais", "Receba ajustes automáticos", "Evolua sua precificação ao longo do uso"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-300" />
                  <span className="text-sm text-white sm:text-[0.95rem]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function HowStep({
  number,
  title,
  description,
  showConnector = false,
}: {
  number: string;
  title: string;
  description: string;
  showConnector?: boolean;
}) {
  return (
    <div className="relative h-full">
      <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-colors transition-shadow duration-150 hover:border-calcularq-blue/80 hover:shadow-md sm:p-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-calcularq-blue text-lg font-bold text-white">
          {number}
        </div>
        <h3 className="mx-auto mb-2 flex min-h-[3.2rem] max-w-[18ch] items-center justify-center px-1 text-base font-semibold leading-snug text-calcularq-blue sm:text-lg">
          {title}
        </h3>
        <p className="mx-auto max-w-[31ch] px-1 text-sm leading-relaxed text-slate-600 sm:text-[0.95rem]">{description}</p>
      </div>

      {showConnector ? (
        <div className="pointer-events-none absolute right-[-1.55rem] top-6 hidden h-1 w-6 rounded-full bg-slate-200 xl:block" />
      ) : null}
    </div>
  );
}
