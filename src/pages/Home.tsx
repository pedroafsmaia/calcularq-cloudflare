import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Calculator, Clock3, DollarSign, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { createPageUrl } from "@/utils";
import { fadeUp, fadeX, listStagger, viewportOnce } from "@/lib/motion";

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
    } else if (!user.hasPaid) {
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
      header: "🏠 SIMPLES",
      projectType: "Residencial",
      area: "80m²",
      stage: "Projeto Exec.",
      score: "Score 28/100",
      complexity: "Complexidade baixa",
      hours: "152h",
      price: "R$ 7.600",
      sqm: "R$ 95/m²",
    },
    {
      header: "🏢 MÉDIO",
      projectType: "Comercial",
      area: "150m²",
      stage: "Projeto Exec.",
      score: "Score 52/100",
      complexity: "Complexidade moderada",
      hours: "299h",
      price: "R$ 14.950",
      sqm: "R$ 100/m²",
    },
    {
      header: "🏥 COMPLEXO",
      projectType: "Clínica Saúde",
      area: "250m²",
      stage: "Projeto Exec.",
      score: "Score 76/100",
      complexity: "Complexidade alta",
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
      <div className="relative">
        <div className="relative overflow-hidden bg-gradient-to-b from-calcularq-blue via-calcularq-blue to-[#01265c]">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-white blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-20">
            <div className="lg:hidden relative z-20 mx-auto mb-[-0.75rem] sm:mb-[-1rem] max-w-[21.5rem] sm:max-w-[22.5rem] px-2">
              <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" animate="show" transition={{ delay: 0.12 }}>
                <img src="/mockup.png" alt="Interface da Calculadora Calcularq" className="w-full h-auto object-contain drop-shadow-2xl" />
              </motion.div>
            </div>

            <div className="relative z-10 grid lg:grid-cols-[1.02fr_0.98fr] gap-8 lg:gap-12 items-center">
              <div className="hidden lg:block">
                <motion.div
                  variants={fadeX(prefersReducedMotion, 18, -1)}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: 0.18 }}
                  className="relative px-2"
                >
                  <img
                    src="/mockup.png"
                    alt="Interface da Calculadora Calcularq"
                    className="w-full h-auto object-contain scale-[0.96] xl:scale-100 drop-shadow-2xl"
                  />
                </motion.div>
              </div>

              <div className="relative z-10">
                <motion.div
                  variants={fadeUp(prefersReducedMotion, 16)}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-5 pt-10 sm:p-8 sm:pt-12 lg:p-10 lg:pt-10 shadow-2xl"
                >
                  <h1 className="text-[2.05rem] sm:text-4xl lg:text-[2.5rem] xl:text-[2.65rem] font-bold text-calcularq-blue mb-4 sm:mb-5 leading-[1.12] tracking-tight text-center">
                    SUA CALCULADORA DE PRECIFICAÇÃO POR COMPLEXIDADE
                  </h1>

                  <p className="text-[0.98rem] sm:text-lg text-slate-700 mb-6 sm:mb-7 leading-relaxed text-center">
                    Precifique seus projetos de arquitetura com inteligência. A Calcularq é uma ferramenta que evolui com você,
                    alinhando seus cálculos à dedicação que cada projeto exige.
                  </p>

                  {!user?.hasPaid ? (
                    <div className="mb-4 sm:mb-5 flex items-center justify-center">
                      <div
                        className="senja-embed"
                        data-id="5c4b77f9-c453-43c6-8dd1-8c015286d9e7"
                        data-mode="shadow"
                        data-lazyload="false"
                        style={{ display: "block", width: "100%", transform: "scale(1.2)", transformOrigin: "center", margin: "0 auto" }}
                      />
                    </div>
                  ) : null}

                  <Link to={user ? createPageUrl("Calculator") : createPageUrl("Login")} onClick={handleCalculatorClick} className="block mb-2.5 sm:mb-3">
                    <Button
                      size="lg"
                      className="w-full text-white px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-shadow duration-150 font-semibold sm:text-lg text-base"
                      style={{ backgroundColor: "#fc7338" }}
                    >
                      {user?.hasPaid ? "Acessar a Calcularq" : "Acessar a Calcularq — R$19,90"}
                    </Button>
                  </Link>

                  {user?.hasPaid ? (
                    <a href="https://senja.io/p/calcularq/r/GRdv6A" target="_blank" rel="noopener noreferrer" className="block mb-3 sm:mb-3.5">
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="w-full px-8 py-6 text-base sm:text-lg rounded-xl border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-calcularq-blue shadow-sm"
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
          <motion.div variants={listStagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeUp(prefersReducedMotion, 12)}
                transition={{ delay: prefersReducedMotion ? 0 : index * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-calcularq-blue/80 hover:shadow-md transition-colors transition-shadow duration-150 text-center flex h-full flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-calcularq-blue/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-calcularq-blue" />
                </div>
                <h3
                  className="min-h-[3.2rem] text-base sm:text-lg font-semibold text-calcularq-blue mb-2 leading-snug max-w-[15ch] sm:max-w-[18ch] mx-auto px-1 flex items-center justify-center"
                  style={{ textWrap: "balance" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-[0.95rem] text-slate-600 leading-relaxed max-w-[31ch] mx-auto px-1 break-words" style={{ textWrap: "pretty" }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 scroll-mt-24">
          <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" whileInView="show" viewport={viewportOnce} className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-calcularq-blue mb-4 tracking-tight">Como funciona</h2>
            <p
              className="text-base sm:text-lg text-slate-700 mb-10 sm:mb-12 max-w-[34ch] sm:max-w-[42ch] md:max-w-[50ch] lg:max-w-[54ch] mx-auto leading-relaxed"
              style={{ textWrap: "balance" }}
            >
              Cada projeto tem sua complexidade. O Calcularq te ajuda a transformar isso em um número, em 3 etapas simples.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
              <FormulaStep
                number="1"
                title="Hora técnica"
                description="Informe suas despesas e horas de trabalho. O sistema calcula sua hora técnica mínima."
              />
              <FormulaStep
                number="2"
                title="Fatores de complexidade"
                description="Informe as características do projeto. O sistema estima as horas necessárias e premia a complexidade."
              />
              <FormulaStep
                number="3"
                title="Preço e ajustes"
                description="As horas estimadas são convertidas em preço com base na sua hora técnica ajustada."
              />
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <motion.div
            variants={fadeUp(prefersReducedMotion, 14)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 md:p-10 shadow-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-calcularq-blue text-center tracking-tight">Mini-demo</h2>
            <p className="mt-3 text-center text-sm sm:text-base text-slate-600">
              Veja exemplos de cenários para entender como o método responde à complexidade.
            </p>

            <div className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
              <Info className="h-4 w-4 shrink-0" />
              <span>O preço depende da sua hora técnica.</span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {demoCards.map((card) => (
                <div key={card.header} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                  <p className="text-sm font-semibold tracking-wide text-calcularq-blue">{card.header}</p>

                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    <p>{card.projectType}</p>
                    <p>{card.area}</p>
                    <p>{card.stage}</p>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="text-sm font-semibold text-slate-800">{card.score}</p>
                    <p className="text-xs text-slate-500">{card.complexity}</p>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-slate-700">
                    <p>⏱️ {card.hours}</p>
                    <p>💰 {card.price}</p>
                    <p>📐 {card.sqm}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link to={createPageUrl("Calculator")} onClick={handleCalculatorClick} className="inline-block">
                <Button className="bg-calcularq-blue text-white hover:bg-[#002366]">Calcular meu projeto →</Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <motion.div
            variants={fadeUp(prefersReducedMotion, 14)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="bg-gradient-to-br from-calcularq-blue via-[#002366] to-calcularq-blue rounded-3xl p-6 sm:p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">Fatores de complexidade</h2>
                <p className="text-sm sm:text-base lg:text-lg text-slate-300 mb-6 leading-relaxed">
                  A Calcularq analisa 6 fatores para medir a complexidade do projeto e ajustar as estimativas de horas e valor.
                </p>
                <Link to={createPageUrl("Calculator")} className="inline-block">
                  <Button className="bg-white text-calcularq-blue border-2 border-white hover:bg-slate-50 hover:border-slate-200 shadow-md hover:shadow-lg transition-colors transition-shadow duration-150 font-semibold px-6 py-3">
                    Experimentar Agora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {factorsList.map((factor) => (
                  <div key={factor} className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="min-w-0 text-white text-sm sm:text-[0.95rem] leading-snug break-words" style={{ textWrap: "balance" }}>
                      {factor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <motion.div
            variants={fadeUp(prefersReducedMotion, 14)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="rounded-3xl border border-slate-200 bg-white px-6 py-10 sm:px-8 sm:py-12 shadow-sm"
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-calcularq-blue mb-4 tracking-tight">Uma calculadora que evolui com você</h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-[58ch]">
                  A Calcularq aprende com cada projeto que você finaliza e ajusta as próximas estimativas automaticamente.
                  Quanto mais você usa, mais precisa ela fica para o seu perfil de trabalho.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-calcularq-blue mb-3">Como funciona:</h3>
                <ul className="space-y-2.5 text-sm sm:text-base text-slate-600">
                  <li>1️⃣ Finalize projetos e registre as horas reais</li>
                  <li>2️⃣ O sistema calibra automaticamente</li>
                  <li>3️⃣ Estimativas ficam personalizadas para você</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

function FormulaStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:border-calcularq-blue/80 hover:shadow-md transition-colors transition-shadow duration-150 text-center flex flex-col">
      <div className="w-12 h-12 rounded-full bg-calcularq-blue text-white text-lg font-bold flex items-center justify-center mx-auto mb-4">{number}</div>
      <h3
        className="min-h-[3.2rem] text-base sm:text-lg font-semibold text-calcularq-blue mb-2 leading-snug max-w-[15ch] sm:max-w-[18ch] mx-auto px-1 flex items-center justify-center"
        style={{ textWrap: "balance" }}
      >
        {title}
      </h3>
      <p className="text-sm sm:text-[0.95rem] text-slate-600 leading-relaxed max-w-[31ch] mx-auto px-1 break-words" style={{ textWrap: "pretty" }}>
        {description}
      </p>
    </div>
  );
}
