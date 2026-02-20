import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Calendar } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PlansSection() {
  const plans = [
    {
      name: "Mensal",
      price: "R$ 29,90",
      period: "/mês",
      description: "Ideal para uso pontual e projetos específicos",
      features: [
        "Acesso à calculadora completa",
        "6 fatores de complexidade",
        "Cálculo em tempo real",
        "Ajuste de pesos personalizados",
        "Resultados detalhados",
        "Suporte por email"
      ],
      cta: "Assinar Mensal",
      popular: false,
      icon: Calendar
    },
    {
      name: "Anual",
      price: "R$ 299,90",
      period: "/ano",
      originalPrice: "R$ 358,80",
      savings: "Economize 16%",
      description: "Melhor custo-benefício para uso contínuo",
      features: [
        "Tudo do plano Mensal",
        "Histórico de cálculos",
        "Exportação de relatórios PDF",
        "Múltiplos perfis de projeto",
        "Suporte prioritário",
        "Atualizações exclusivas",
        "Economia de 16% comparado ao mensal"
      ],
      cta: "Assinar Anual",
      popular: true,
      icon: Sparkles
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Escolha seu Plano
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Escolha o plano que melhor se adapta às suas necessidades
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`
              relative bg-white rounded-2xl border-2 p-8 shadow-lg hover:shadow-xl transition-all duration-300
              ${plan.popular 
                ? "border-slate-900 scale-105 md:scale-110" 
                : "border-slate-200"
              }
            `}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className={`
                inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
                ${plan.popular ? "bg-slate-900" : "bg-slate-100"}
              `}>
                <plan.icon className={`w-8 h-8 ${plan.popular ? "text-white" : "text-slate-700"}`} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <div className="flex flex-col items-center gap-1 mb-2">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-slate-500">{plan.period}</span>
                  )}
                </div>
                {plan.originalPrice && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-400 line-through">{plan.originalPrice}</span>
                    {plan.savings && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                        {plan.savings}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-sm">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to={createPageUrl("Calculator")} className="block">
              <Button
                className={`
                  w-full py-6 text-base font-semibold
                  ${plan.popular 
                    ? "bg-slate-900 hover:bg-slate-800 text-white" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  }
                `}
              >
                {plan.cta}
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}




