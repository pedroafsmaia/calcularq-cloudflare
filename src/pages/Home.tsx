import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Carregar script do Senja.io
  useEffect(() => {
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
  }, []);

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
      title: "Cálculo da Complexidade",
      description: "Garante uma precificação justa ao considerar fatores de complexidade do projeto."
    },
    {
      icon: Globe,
      title: "Acesso em Qualquer Lugar",
      description: "Uma ferramenta prática e 100% online, pronta para usar em qualquer dispositivo."
    },
    {
      icon: DollarSign,
      title: "Investimento Mínimo",
      description: "Solução de baixo custo para facilitar a precificação dos seus projetos de arquitetura."
    },
    {
      icon: Zap,
      title: "Agilidade na Entrega",
      description: "Reduza o tempo de elaboração de propostas e envie cálculos precisos com rapidez."
    }
  ];

  const factorsList = [
    "Área de Projeto",
    "Etapa do Projeto", 
    "Nível de Detalhamento",
    "Exigência Técnica",
    "Exigência Burocrática",
    "Dedicação à Obra"
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="relative">
        {/* Hero Section - Novo Banner */}
        <div className="relative bg-calcularq-blue overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Side - Mockup */}
              <div className="hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative"
                >
                  <div className="transparent">
                    <img 
                      src="/mockup.png" 
                      alt="Interface da Calculadora Calcularq" 
                      className="w-full h-auto rounded-xl scale-105"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Right Side - Content */}
              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 shadow-2xl"
                >
                  {/* Logo removido do banner conforme feedback */}

                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-calcularq-blue mb-6 leading-tight text-center">
                    SUA CALCULADORA DE PRECIFICAÇÃO POR COMPLEXIDADE
                  </h1>

                  <p className="text-lg text-slate-700 mb-8 leading-relaxed text-center">
                    Precifique seus projetos de arquitetura. A Calcularq é uma ferramenta precisa para alinhar seus cálculos à dedicação que cada projeto exige.
                  </p>

                  {/* Senja.io Widget */}
                  <div className="mb-6 flex items-center justify-center">
                    <div 
                      className="senja-embed" 
                      data-id="5c4b77f9-c453-43c6-8dd1-8c015286d9e7"
                      data-mode="shadow"
                      data-lazyload="false"
                      style={{ display: 'block', width: '100%' }}
                    />
                  </div>
                  
                  {/* Botão de avaliação para usuários pagos */}
                  {user?.hasPaid && (
                    <div className="mb-6 text-center">
                      <a
                        href="https://senja.io/p/calcularq/r/GRdv6A"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#fc7338] hover:underline font-medium"
                      >
                        Avalie a Calcularq
                      </a>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Link 
                    to={user ? createPageUrl("Calculator") : createPageUrl("Login")} 
                    onClick={handleCalculatorClick}
                    className="block mb-3"
                  >
                    <Button 
                      size="lg" 
                      className="w-full text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold sm:text-lg text-base"
                      style={{ backgroundColor: '#fc7338' }}
                    >
                      {user?.hasPaid ? (
                        "Acessar a Calcularq"
                      ) : (
                        <>
                          <span className="hidden sm:inline">Acesse agora por apenas R$19,90</span>
                          <span className="sm:hidden">Apenas R$19,90</span>
                        </>
                      )}
                    </Button>
                  </Link>

                  <p className="text-center text-sm text-slate-600">
                    Pagamento único. Sem mensalidades.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-calcularq-blue hover:shadow-lg transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-calcularq-blue/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-calcularq-blue" />
                </div>
                <h3 className="text-lg font-semibold text-calcularq-blue mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Factors Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-calcularq-blue via-[#002366] to-calcularq-blue rounded-3xl p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Fatores de Complexidade
                </h2>
                <p className="text-slate-300 mb-6">
                  Nossa calculadora considera 6 fatores essenciais para 
                  determinar a complexidade real do seu projeto.
                </p>
                <Link to={createPageUrl("Calculator")} className="inline-block">
                  <Button 
                    className="bg-white text-calcularq-blue border-2 border-white hover:bg-slate-50 hover:border-slate-200 shadow-lg font-semibold px-6 py-3"
                  >
                    Experimentar Agora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {factorsList.map((factor, index) => (
                  <motion.div
                    key={factor}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-white text-sm">{factor}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-calcularq-blue mb-4">
              Ajustes Finais
            </h2>
            <p className="text-lg text-slate-700 mb-12 max-w-3xl mx-auto">
              Adicione despesas variáveis, aplique descontos estratégicos e visualize instantaneamente o preço de venda final do seu projeto.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <FormulaStep 
                number="1" 
                title="Insira seus dados"
                description="Cadastre suas despesas e sua disponibilidade de horas no mês. O sistema define automaticamente o valor mínimo da sua hora técnica."
              />
              <FormulaStep 
                number="2" 
                title="Configure o Projeto"
                description="Avalie o nível de dificuldade do projeto ajustando os 6 fatores de complexidade da Calcularq."
              />
              <FormulaStep 
                number="3" 
                title="Obtenha o Preço"
                description="Visualize instantaneamente o preço ideal do projeto, considerando sua complexidade."
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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-calcularq-blue hover:shadow-lg transition-all duration-300">
      <div className="w-12 h-12 rounded-full bg-calcularq-blue text-white text-lg font-bold flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-calcularq-blue mb-3 text-lg">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
