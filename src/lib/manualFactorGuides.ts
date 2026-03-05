type ManualFactorGuide = {
  title: string;
  intro?: string;
  options: string[];
  footer?: string;
};

const MANUAL_FACTOR_GUIDES: Record<string, ManualFactorGuide> = {
  volume: {
    title: "Volume do projeto",
    options: [
      "1 nível: Projeto térreo ou unidade única",
      "2-3 níveis: Sobrado ou pequeno edifício",
      "4-6 níveis: Edifício médio com repetição",
      "7-15 níveis: Edifício alto",
      "16+ níveis: Edifício muito alto",
    ],
    footer: "Subsolo conta como nível adicional.",
  },
  tipology: {
    title: "Tipologia",
    intro: "Natureza principal do projeto arquitetônico.",
    options: [
      "Residencial: Casas e apartamentos padrão",
      "Comercial/Serviços: Lojas, escritórios e galpão/logística/armazenagem simples",
      "Institucional: Escolas, sedes públicas e similares",
      "Industrial: Industrial de processos (layout de produção e exigências técnicas específicas)",
      "Saúde: Clínicas/hospitais e casos com salas limpas, ANVISA ou farmacêutico",
    ],
  },
  stage: {
    title: "Etapa final",
    intro: "Define até qual fase do ciclo de desenvolvimento o arquiteto entregará o projeto.",
    options: [
      "Consultoria/Briefing: Diretrizes iniciais",
      "Estudo preliminar: Conceito e partido",
      "Anteprojeto: Solução consolidada",
      "Projeto executivo: Detalhamento para obra",
      "Compatibilização de complementares: Coordenação técnica completa",
    ],
  },
  detail: {
    title: "Nível de detalhamento",
    intro: "Mede a quantidade de desenhos e o esforço criativo exigido.",
    options: [
      "Mínimo: Diretrizes gerais",
      "Básico: Soluções padronizadas",
      "Médio: Equilíbrio catálogo/sob medida",
      "Alto: Forte personalização",
      "Máximo: Detalhamento exaustivo",
    ],
  },
  technical: {
    title: "Exigência técnica",
    intro: "Mede o rigor normativo e o volume de estudo técnico necessário.",
    options: [
      "Mínima: Regras usuais do código local",
      "Baixa: Consultas pontuais a regulamentos específicos",
      "Média: Normas recorrentes de segurança/acessibilidade",
      "Alta: Requisitos técnicos específicos da atividade",
      "Máxima: Ambientes altamente regulados",
    ],
  },
  bureaucratic: {
    title: "Exigência burocrática",
    intro: "Mede a carga administrativa e o esforço de tramitação/aprovação.",
    options: [
      "Mínima: Formalização profissional básica",
      "Baixa: Trâmite principal em uma esfera",
      "Média: Prefeitura e instâncias complementares",
      "Alta: Múltiplos órgãos e processos paralelos",
      "Máxima: Processos longos e rigorosos",
    ],
  },
  monitoring: {
    title: "Dedicação à obra",
    intro: "Frequência de visitas e nível de responsabilidade durante a execução.",
    options: [
      "Levantamento: Sem acompanhamento contínuo",
      "Pontual: Visitas estratégicas",
      "Por etapas: Checagens por fase",
      "Acompanhamento: Presença frequente na obra",
      "Gestão: Coordenação ativa da execução",
    ],
  },
};

export function getManualFactorTooltip(factorId: string): string | undefined {
  const guide = MANUAL_FACTOR_GUIDES[factorId];
  if (!guide) return undefined;

  const lines = [guide.title];
  if (guide.intro) lines.push(guide.intro);
  lines.push(...guide.options.map((option) => `• ${option}`));
  if (guide.footer) lines.push(guide.footer);

  return lines.join("\n");
}
