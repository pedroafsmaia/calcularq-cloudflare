import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { 
  Calculator, 
  Globe,
  DollarSign,
  Zap,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { fadeUp, fadeX, listStagger, viewportOnce } from "@/lib/motion";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = !!useReducedMotion();

  // Carregar script do Senja.io
  useEffect(() => {
    if (user?.hasPaid) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://widget.senja.io/widget/5c4b77f9-c453-43c6-8dd1-8c015286d9e7/platform.js';
    script.type = 'text/javascript';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Limpar script ao desmontar
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
      title: "Cálculo da complexidade",
      description: "Garante uma precificação justa ao considerar fatores de complexidade do projeto."
    },
    {
      icon: Globe,
      title: "Acesso em qualquer lugar",
      description: "Uma ferramenta prática e 100% online, pronta para usar em qualquer dispositivo."
    },
    {
      icon: DollarSign,
      title: "Preço acessível",
      description: "Acesso completo por um valor único e justo, sem mensalidades ou custos surpresa."
    },
    {
      icon: Zap,
      title: "Agilidade na entrega",
      description: "Reduza o tempo de elaboração de propostas e envie cálculos precisos com rapidez."
    }
  ];

  const factorsList = [
    "Área de projeto",
    "Etapa de projeto", 
    "Nível de detalhamento",
    "Exigência técnica",
    "Exigência burocrática",
    "Dedicação à obra"
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="relative">
        {/* Hero Section - Novo Banner */}
        <div className="relative overflow-hidden bg-gradient-to-b from-calcularq-blue via-calcularq-blue to-[#01265c]">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-white blur-3xl" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-20">
            <div className="lg:hidden relative z-20 mx-auto mb-[-0.75rem] sm:mb-[-1rem] max-w-[21.5rem] sm:max-w-[22.5rem] px-2">
              <motion.div
                variants={fadeUp(prefersReducedMotion, 14)}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.12 }}
              >
                <img
                  src="/mockup.png"
                  alt="Interface da Calculadora Calcularq"
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
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
                  {/* Logo removido do banner conforme feedback */}

                  <h1 className="text-[2.05rem] sm:text-4xl lg:text-[2.5rem] xl:text-[2.65rem] font-bold text-calcularq-blue mb-4 sm:mb-5 leading-[1.12] tracking-tight text-center">
                    SUA CALCULADORA DE PRECIFICAÇÃO POR COMPLEXIDADE
                  </h1>

                  <p className="text-[0.98rem] sm:text-lg text-slate-700 mb-6 sm:mb-7 leading-relaxed text-center">
                    Precifique seus projetos de arquitetura. A Calcularq é uma ferramenta precisa para alinhar seus cálculos à dedicação que cada projeto exige.
                  </p>

                  {!user?.hasPaid ? (
                    <div className="mb-4 sm:mb-5 flex items-center justify-center">
                      <div 
                        className="senja-embed" 
                        data-id="5c4b77f9-c453-43c6-8dd1-8c015286d9e7"
                        data-mode="shadow"
                        data-lazyload="false"
                        style={{ display: 'block', width: '100%', transform: 'scale(1.2)', transformOrigin: 'center', margin: '0 auto' }}
                      />
                    </div>
                  ) : null}

                  {/* CTA Button */}
                  <Link 
                    to={user ? createPageUrl("Calculator") : createPageUrl("Login")} 
                    onClick={handleCalculatorClick}
                    className="block mb-2.5 sm:mb-3"
                  >
                    <Button 
                      size="lg" 
                      className="w-full text-white px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-shadow duration-150 font-semibold sm:text-lg text-base"
                      style={{ backgroundColor: '#fc7338' }}
                    >
                      {user?.hasPaid ? (
                        "Acessar a Calcularq"
                      ) : (
                        <>
                          <span className="hidden sm:inline">Acesse agora por apenas R$19,90</span>
                          <span className="sm:hidden">Acessar por R$19,90</span>
                        </>
                      )}
                    </Button>
                  </Link>

                  {user?.hasPaid ? (
                    <a
                      href="https://senja.io/p/calcularq/r/GRdv6A"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-3 sm:mb-3.5"
                    >
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

                  <p className="text-center text-sm text-slate-600">
                    Pagamento único. Sem mensalidades.
                  </p>
                </motion.div>
              </div>
            </div>

          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
          <motion.div
            variants={listStagger}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeUp(prefersReducedMotion, 12)}
                transition={{ delay: prefersReducedMotion ? 0 : index * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-calcularq-blue/80 hover:shadow-md transition-colors transition-shadow duration-150 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-calcularq-blue/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-calcularq-blue" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-calcularq-blue mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-[0.95rem] text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Factors Section */}
        <div id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 scroll-mt-24">
          <motion.div
            variants={fadeUp(prefersReducedMotion, 14)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="bg-gradient-to-br from-calcularq-blue via-[#002366] to-calcularq-blue rounded-3xl p-6 sm:p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
                  Fatores de complexidade
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-slate-300 mb-6 leading-relaxed">
                  Nossa calculadora considera 6 fatores essenciais para 
                  determinar a complexidade real do seu projeto.
                </p>
                <Link to={createPageUrl("Calculator")} className="inline-block">
                  <Button 
                    className="bg-white text-calcularq-blue border-2 border-white hover:bg-slate-50 hover:border-slate-200 shadow-md hover:shadow-lg transition-colors transition-shadow duration-150 font-semibold px-6 py-3"
                  >
                    Experimentar Agora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {factorsList.map((factor) => (
                  <div
                    key={factor}
                    className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-white text-sm sm:text-[0.95rem]">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <motion.div
            variants={fadeUp(prefersReducedMotion, 14)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-calcularq-blue mb-4 tracking-tight">
              Como funciona
            </h2>
            <p className="text-base sm:text-lg text-slate-700 mb-10 sm:mb-12 max-w-[34ch] sm:max-w-[42ch] md:max-w-[50ch] lg:max-w-[54ch] mx-auto leading-relaxed" style={{ textWrap: "balance" }}>
              {"Cada projeto tem sua complexidade. O Calcularq te ajuda a transformar isso em um número — em 4 etapas simples."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
              <FormulaStep 
                number="1" 
                title={"Hora técnica mínima"}
                description={"Informe suas despesas e horas de trabalho. O Calcularq descobre sua hora técnica mínima."}
              />
              <FormulaStep 
                number="2" 
                title="Fatores de complexidade"
                description={"Informe a área e as características do projeto. O Calcularq mede o esforço real envolvido."}
              />
              <FormulaStep 
                number="3" 
                title="Calibragem dos pesos"
                description={"Personalize o quanto cada fator influencia o cálculo. Ou pule e use os valores padrão."}
              />
              <FormulaStep 
                number="4" 
                title={"Composição final"}
                description={"Estime as horas de projeto, adicione despesas variáveis e desconto. O preço de venda aparece na hora."}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FormulaStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:border-calcularq-blue/80 hover:shadow-md transition-colors transition-shadow duration-150 text-center">
      <div className="w-12 h-12 rounded-full bg-calcularq-blue text-white text-lg font-bold flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-calcularq-blue mb-2 text-base sm:text-lg leading-snug max-w-[15ch] sm:max-w-[18ch] mx-auto px-1" style={{ textWrap: "balance" }}>{title}</h3>
      <p className="text-slate-600 text-sm sm:text-[0.95rem] leading-relaxed max-w-[26ch] sm:max-w-[30ch] lg:max-w-[29ch] mx-auto px-1 break-words" style={{ textWrap: "pretty" }}>
        {description}
      </p>
    </div>
  );
}

