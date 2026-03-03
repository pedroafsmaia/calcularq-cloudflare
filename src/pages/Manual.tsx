import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp, LifeBuoy, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import { fadeUp } from "@/lib/motion";

type Section = {
  id: string;
  title: string;
  content: string[];
};

const MANUAL_SECTIONS: Section[] = [
  {
    id: "primeiros-passos",
    title: "1. Primeiros passos",
    content: [
      "Comece definindo sua hora técnica mínima e a margem de lucro desejada.",
      "Use valores realistas do seu escritório para evitar distorções no preço final.",
      "A etapa inicial cria a base financeira do cálculo.",
    ],
  },
  {
    id: "usando-calculadora",
    title: "2. Usando a calculadora",
    content: [
      "Preencha os dados essenciais do projeto: área, tipologia, níveis, reforma e etapa final.",
      "Em seguida, defina os níveis de complexidade técnica e burocrática.",
      "O objetivo é traduzir esforço real de execução em horas estimadas.",
    ],
  },
  {
    id: "entendendo-resultado",
    title: "3. Entendendo o resultado",
    content: [
      "Escolha entre cenário conservador ou otimista para gerar as horas finais.",
      "Ajuste manualmente as horas apenas quando houver justificativa técnica/comercial.",
      "Use os indicadores de preço por m² e valor/hora como referência de mercado, não como regra rígida.",
    ],
  },
  {
    id: "faq-suporte",
    title: "4. FAQ & suporte",
    content: [
      "As respostas abaixo resumem os principais pontos de acesso, reembolso, dados e responsabilidades de uso.",
      "Para suporte, utilize o e-mail oficial: atendimento@calcularq.com.br.",
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "Quanto tempo tenho de acesso?",
    a: "Garantia mínima de 6 meses. Após isso, o acesso continua enquanto o software estiver disponível (Life of the Software).",
  },
  {
    q: "Posso usar em quantos projetos?",
    a: "Ilimitado durante o período de acesso.",
  },
  {
    q: "Posso pedir reembolso?",
    a: "Sim. Você tem 7 dias corridos para solicitar reembolso integral pelo atendimento@calcularq.com.br.",
  },
  {
    q: "E se o sistema sair do ar antes de 6 meses?",
    a: "Você recebe reembolso integral, independente do tempo já utilizado.",
  },
  {
    q: "O software pode sair do ar?",
    a: "Sim. Após os 6 meses de garantia, pode ser descontinuado com aviso prévio de 30 dias para exportação dos dados.",
  },
  {
    q: "Posso transferir minha conta?",
    a: "Não. A licença é pessoal e intransferível.",
  },
  {
    q: "O preço sugerido está sempre certo?",
    a: "Não. O Calcularq é ferramenta de apoio. A validação final da proposta é sua responsabilidade.",
  },
  {
    q: "Posso mudar minha HT_min depois?",
    a: "Sim. Você pode recalcular sua base sempre que precisar.",
  },
  {
    q: "Os cálculos salvos ficam guardados?",
    a: "Sim, durante o período de acesso. Se houver descontinuação, exporte seus dados antes do prazo final.",
  },
  {
    q: "Há garantia de que vou lucrar com os preços calculados?",
    a: "Não. A ferramenta auxilia no cálculo, mas não garante aceitação comercial nem rentabilidade.",
  },
  {
    q: "Vocês guardam meus dados de cartão?",
    a: "Não. O pagamento é processado pela Stripe e os dados bancários não ficam armazenados no sistema.",
  },
  {
    q: "Posso inserir dados dos meus clientes?",
    a: "Sim, desde que você tenha as autorizações necessárias e cumpra LGPD no seu uso.",
  },
  {
    q: "Os termos podem mudar?",
    a: "Sim. Mudanças relevantes são comunicadas com antecedência de 15 dias.",
  },
];

export default function Manual() {
  const prefersReducedMotion = !!useReducedMotion();
  const [openSectionId, setOpenSectionId] = useState<string>(MANUAL_SECTIONS[0].id);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <motion.section variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-calcularq-blue mb-4">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-calcularq-blue">Manual de instruções</h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Guia objetivo para usar a calculadora, interpretar o resultado e consultar dúvidas frequentes.
          </p>
        </motion.section>

        <div className="mt-6 space-y-4">
          {MANUAL_SECTIONS.map((section) => {
            const isOpen = openSectionId === section.id;
            return (
              <motion.section
                key={section.id}
                variants={fadeUp(prefersReducedMotion, 12)}
                initial="hidden"
                animate="show"
                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenSectionId(isOpen ? "" : section.id)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 rounded-2xl"
                >
                  <h2 className="text-base sm:text-lg font-semibold text-calcularq-blue">{section.title}</h2>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-calcularq-blue" /> : <ChevronDown className="w-4 h-4 text-calcularq-blue" />}
                </button>

                {isOpen ? (
                  <div className="border-t border-slate-200 px-5 py-4">
                    <ul className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
                      {section.content.map((line) => (
                        <li key={line} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-calcularq-blue/40 shrink-0" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>

                    {section.id === "faq-suporte" ? (
                      <div className="mt-5 space-y-3">
                        {FAQ_ITEMS.map((item) => (
                          <div key={item.q} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                            <p className="text-sm sm:text-base font-semibold text-slate-800">{item.q}</p>
                            <p className="mt-1 text-sm sm:text-base text-slate-700 leading-relaxed">{item.a}</p>
                          </div>
                        ))}
                        <div className="rounded-xl border border-calcularq-blue/20 bg-calcularq-blue/5 px-4 py-3 text-sm sm:text-base text-calcularq-blue">
                          <div className="inline-flex items-center gap-2 font-semibold">
                            <LifeBuoy className="w-4 h-4" />
                            Suporte
                          </div>
                          <p className="mt-1">E-mail: atendimento@calcularq.com.br</p>
                          <p className="text-sm mt-1">Resposta em até 24h úteis.</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </motion.section>
            );
          })}
        </div>

        <motion.section variants={fadeUp(prefersReducedMotion, 12)} initial="hidden" animate="show" className="mt-6 rounded-2xl bg-gradient-to-br from-calcularq-blue to-[#002366] p-6 text-white shadow-sm">
          <h3 className="text-xl font-bold">Pronto para calcular?</h3>
          <p className="mt-2 text-sm sm:text-base text-white/90">
            Use o fluxo completo da calculadora e salve seus projetos para histórico e comparação.
          </p>
          <Link
            to={createPageUrl("Calculator")}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-calcularq-blue hover:bg-slate-100"
          >
            Ir para a calculadora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
