import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Settings2, Layers, DollarSign, Info, ChevronDown, ChevronUp } from "lucide-react";

export default function Manual() {
  const [expandedFactors, setExpandedFactors] = useState<Record<string, boolean>>({
    area: false,
    stage: false,
    detail: false,
    technical: false,
    bureaucratic: false,
    monitoring: false,
  });

  const toggleFactor = (factorId: string) => {
    setExpandedFactors(prev => ({
      ...prev,
      [factorId]: !prev[factorId]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-calcularq-blue mb-6">
            <img src="/logomarca-branca.png" alt="Calcularq" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-calcularq-blue mb-4">
            Manual de Instruções
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed text-center max-w-3xl mx-auto">
            Bem-vindo à Calcularq, uma calculadora que utiliza um algoritmo de precificação por
            complexidade. Diferente de tabelas convencionais baseadas apenas em metragem quadrada
            ou estimativas subjetivas, a Calcularq gera honorários cruzando o custo operacional do seu
            trabalho com o nível de complexidade de cada projeto.
          </p>
          <p className="text-lg text-slate-700 font-semibold mt-4 text-center">
            Siga o roteiro abaixo para entender o sistema e realizar seus cálculos:
          </p>
        </motion.div>

        <div className="space-y-12">
          {/* Seção 1 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-calcularq-blue" />
              </div>
              <h2 className="text-2xl font-bold text-calcularq-blue">
                1. Definição da hora técnica mínima
              </h2>
            </div>
            <p className="text-slate-700 mb-6">
              A primeira etapa é estabelecer o custo real da sua hora de trabalho. O sistema calcula a Hora
              Técnica Mínima, que representa o "piso" financeiro para que o escritório opere sem prejuízo.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">O que você precisa preencher:</h3>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-calcularq-blue font-bold mt-1">●</span>
                    <div>
                      <strong>Suas despesas fixas mensais:</strong> Utilize a nossa lista dinâmica para adicionar todas as
                      suas despesas recorrentes para manter o escritório aberto.
                      <p className="text-sm text-slate-600 mt-1">
                        Exemplos: Aluguel, softwares, salários, contador, anuidades do CAU,...
                      </p>
                      <p className="text-sm text-amber-700 mt-1 font-medium">
                        Atenção: Não inclua custos variáveis (como plotagens ou impostos de nota
                        fiscal) nesta etapa, você poderá fazer isso mais tarde.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-calcularq-blue font-bold mt-1">●</span>
                    <div>
                      <strong>Pró-labore mínimo:</strong> Adicione qual é a remuneração mensal líquida essencial para
                      cobrir suas despesas pessoais.
                      <p className="text-sm text-amber-700 mt-1 font-medium">
                        Atenção: Insira o valor necessário para sua segurança financeira. O lucro virá
                        através do multiplicador de complexidade.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-calcularq-blue font-bold mt-1">●</span>
                    <div>
                      <strong>Horas produtivas mensais:</strong> Total de horas que você ou sua equipe dedicam
                      efetivamente à produção de projetos por mês.
                      <p className="text-sm text-blue-700 mt-1 font-medium">
                        Dica: Considere apenas o tempo focado em projeto, cerca de 70% a 80% do
                        tempo total, descontando pausas e tarefas administrativas.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                <p className="text-slate-700">
                  <strong>O resultado:</strong> O sistema define a hora técnica mínima. Mais adiante esse valor será multiplicado
                  de acordo com a complexidade do projeto.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Seção 2 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
                <Settings2 className="w-6 h-6 text-calcularq-blue" />
              </div>
              <h2 className="text-2xl font-bold text-calcularq-blue">
                2. Calibração Estratégica (Pesos)
              </h2>
            </div>
            <p className="text-slate-700 mb-6">
              Nesta segunda etapa, você pode ajustar as engrenagens do algoritmo para que ele calcule os
              preços de acordo com a visão e estratégia do seu escritório.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Configuração de Pesos (0 a 6):</h3>
                <p className="text-slate-700 mb-4">
                  Você pode atribuir um peso para cada um dos 6 fatores de complexidade. O peso define a
                  força que cada critério exerce sobre o cálculo final.
                </p>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-calcularq-blue font-bold mt-1">●</span>
                    <div>
                      <strong>Recomendação:</strong> Sugerimos manter o Peso 1 (Padrão) para todos os fatores
                      inicialmente. Isso garante uma precificação matematicamente equilibrada.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-calcularq-blue font-bold mt-1">●</span>
                    <div>
                      <strong>Quando alterar:</strong> Altere o peso quando julgar que um dos nossos fatores de
                      complexidade deve contribuir mais para o preço do projeto do que os outros. Ao
                      aumentar o peso, você indica ao sistema que aquele critério é mais importante para sua
                      precificação.
                      <p className="text-sm text-slate-600 mt-2 italic">
                        Exemplo: Se o seu escritório é especializado em interiores de alto luxo, você
                        pode aumentar o peso do fator "Nível de Detalhamento" para 2 ou 3, fazendo
                        com que esse critério encareça mais o projeto do que os outros.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Seção 3 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-calcularq-blue" />
              </div>
              <h2 className="text-2xl font-bold text-calcularq-blue">
                3. Análise dos fatores de complexidade
              </h2>
            </div>
            <p className="text-slate-700 mb-6">
              Nesta terceira etapa, classifique os fatores de complexidade do projeto em uma escala de 1 a 5
              ao escolher uma opção entre os valores pré-definidos para cada um. O algoritmo cruzará
              esses dados para calcular a Complexidade Global do projeto. Os fatores e seus valores são os
              seguintes:
            </p>

            <div className="space-y-4">
              {/* Fator 1: Área */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFactor('area')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <h3 className="text-lg font-bold text-calcularq-blue">1. Área de projeto (m²)</h3>
                  {expandedFactors.area ? (
                    <ChevronUp className="w-5 h-5 text-calcularq-blue" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-calcularq-blue" />
                  )}
                </button>
                {expandedFactors.area && (
                  <div className="p-4 border-t border-slate-200">
                    <p className="text-slate-700 mb-4">
                      <strong>Definição:</strong> Estimativa da metragem total de intervenção. Mede a escala física do
                      projeto, impactando diretamente o volume de trabalho.
                    </p>
                    <ul className="space-y-3 text-slate-700">
                      <li><strong>1. Até 49m²:</strong> Intervenções pontuais e rápidas. Como reformas de cômodos, banheiros, consultorias ou apartamentos pequenos.</li>
                      <li><strong>2. 50 a 149m²:</strong> O padrão de mercado para projetos convencionais. Como casas de pavimento térreo, apartamentos completos, lojas de rua ou escritórios.</li>
                      <li><strong>3. 150 a 499m²:</strong> Projetos de porte robusto e áreas generosas. Como casas de alto padrão, lajes corporativas inteiras ou restaurantes.</li>
                      <li><strong>4. 500 a 999m²:</strong> Projetos de edificações completas e de porte significativo. Como mansões, sedes empresariais ou grandes espaços comerciais.</li>
                      <li><strong>5. Acima de 1000m²:</strong> Grandes volumes construtivos e áreas institucionais. Como escolas, hospitais, indústrias ou intervenções urbanísticas.</li>
                    </ul>
                    <p className="text-sm text-amber-700 mt-3 font-medium">
                      Atenção: Os intervalos acima são a sugestão padrão do sistema. Você pode
                      editá-los nas configurações do fator para adequá-lo à sua realidade.
                    </p>
                  </div>
                )}
              </div>

              {/* Fator 2: Etapa */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFactor('stage')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <h3 className="text-lg font-bold text-calcularq-blue">2. Etapa de Projeto</h3>
                  {expandedFactors.stage ? (
                    <ChevronUp className="w-5 h-5 text-calcularq-blue" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-calcularq-blue" />
                  )}
                </button>
                {expandedFactors.stage && (
                  <div className="p-4 border-t border-slate-200">
                    <p className="text-slate-700 mb-4">
                      <strong>Definição:</strong> Define até qual fase do ciclo de desenvolvimento o arquiteto desenvolverá o projeto.
                    </p>
                    <ul className="space-y-2 text-slate-700">
                      <li><strong>1. Consultoria:</strong> Apenas diagnósticos, visitas técnicas ou moodboards. Não há produção de desenhos técnicos ou arquivos formais de projeto.</li>
                      <li><strong>2. Estudo Preliminar:</strong> Concepção visual e validação funcional. Entrega de 3D e plantas para aprovação estética, verificação de fluxos e dimensionamento dos ambientes. Insuficiente para construção.</li>
                      <li><strong>3. Anteprojeto:</strong> Definição técnica do partido. Plantas dimensionadas que permitem aprovação na Prefeitura e orçamentos preliminares.</li>
                      <li><strong>4. Projeto Executivo:</strong> Entrega do caderno técnico final focado na Arquitetura, contendo as informações necessárias para a execução da obra.</li>
                      <li><strong>5. Coordenação de Complementares:</strong> O pacote completo. Além do Executivo, o arquiteto lidera a compatibilização rigorosa entre a arquitetura e os projetos complementares (estrutural, elétrico, hidráulico, ...).</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Fator 3: Detalhamento */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFactor('detail')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <h3 className="text-lg font-bold text-calcularq-blue">3. Nível de Detalhamento</h3>
                  {expandedFactors.detail ? (
                    <ChevronUp className="w-5 h-5 text-calcularq-blue" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-calcularq-blue" />
                  )}
                </button>
                {expandedFactors.detail && (
                  <div className="p-4 border-t border-slate-200">
                    <p className="text-slate-700 mb-4">
                      <strong>Definição:</strong> Mede a quantidade de desenhos e o esforço criativo exigido.
                    </p>
                    <ul className="space-y-2 text-slate-700">
                      <li><strong>1. Mínimo:</strong> Apenas diretrizes de layout e sugestões gerais. Sem detalhamento técnico ou esforço de criação específica.</li>
                      <li><strong>2. Básico:</strong> Predomínio de soluções padronizadas e itens de catálogo. Baixa demanda de desenho e baixo esforço criativo.</li>
                      <li><strong>3. Médio:</strong> Design sob medida utilizando padrões de mercado. Foco em itens convencionais (marcenaria e pedras), exigindo esforço de criação moderado.</li>
                      <li><strong>4. Alto:</strong> Personalização abrangente e refinada. Exige alto esforço de criação e grande volume de desenhos para detalhar soluções estéticas elaboradas.</li>
                      <li><strong>5. Máximo:</strong> Design autoral com soluções atípicas ou inéditas. Demanda esforço criativo extremo e detalhamento técnico exaustivo.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Fator 4: Exigência Técnica */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFactor('technical')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <h3 className="text-lg font-bold text-calcularq-blue">4. Exigência Técnica</h3>
                  {expandedFactors.technical ? (
                    <ChevronUp className="w-5 h-5 text-calcularq-blue" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-calcularq-blue" />
                  )}
                </button>
                {expandedFactors.technical && (
                  <div className="p-4 border-t border-slate-200">
                    <p className="text-slate-700 mb-4">
                      <strong>Definição:</strong> Define a rigidez das normas, leis e o volume de estudo técnico necessário.
                    </p>
                    <ul className="space-y-2 text-slate-700">
                      <li><strong>1. Mínima:</strong> Apenas Código de Obras municipal. Conhecimento já consolidado, sem necessidade de estudo extra.</li>
                      <li><strong>2. Baixa:</strong> Exige consultas pontuais a regulamentos locais específicos, como o regimento interno de condomínios.</li>
                      <li><strong>3. Média:</strong> Requer adequação a normas técnicas rígidas de segurança e/ou acessibilidade, como a dos Bombeiros (AVCB) e a NBR 9050, além do padrão da Prefeitura.</li>
                      <li><strong>4. Alta:</strong> Requer estudo de legislação e regras específicas da atividade, como normas do MEC para escolas ou normas de segurança para Agências Bancárias.</li>
                      <li><strong>5. Máxima:</strong> Malha normativa rígida e restritiva. Exige domínio profundo de leis complexas, como Hospitalar (RDC-50), Ambiental ou Patrimônio Histórico.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Fator 5: Exigência Burocrática */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFactor('bureaucratic')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <h3 className="text-lg font-bold text-calcularq-blue">5. Exigência Burocrática</h3>
                  {expandedFactors.bureaucratic ? (
                    <ChevronUp className="w-5 h-5 text-calcularq-blue" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-calcularq-blue" />
                  )}
                </button>
                {expandedFactors.bureaucratic && (
                  <div className="p-4 border-t border-slate-200">
                    <p className="text-slate-700 mb-4">
                      <strong>Definição:</strong> Mede a carga administrativa e a gestão de aprovações em órgãos públicos.
                    </p>
                    <ul className="space-y-2 text-slate-700">
                      <li><strong>1. Mínima:</strong> Apenas formalização profissional (Emissão de RRT/ART).</li>
                      <li><strong>2. Baixa:</strong> Trâmite em esfera única. Exige aprovação de projeto legal apenas na Prefeitura Municipal.</li>
                      <li><strong>3. Média:</strong> O cenário mais comum. Requer a aprovação municipal somada a uma instância extra, como associações de condomínio ou corpo de bombeiros.</li>
                      <li><strong>4. Alta:</strong> Exige a gestão de processos simultâneos ou específicos, como Vigilância Sanitária, concessionárias ou órgãos de trânsito.</li>
                      <li><strong>5. Máxima:</strong> Requer processos longos e rigorosos, podendo envolver Licenciamento Ambiental, EIV (Estudo de Impacto de Vizinhança) ou Patrimônio Histórico.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Fator 6: Dedicação */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFactor('monitoring')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <h3 className="text-lg font-bold text-calcularq-blue">6. Dedicação à Obra</h3>
                  {expandedFactors.monitoring ? (
                    <ChevronUp className="w-5 h-5 text-calcularq-blue" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-calcularq-blue" />
                  )}
                </button>
                {expandedFactors.monitoring && (
                  <div className="p-4 border-t border-slate-200">
                    <p className="text-slate-700 mb-4">
                      <strong>Definição:</strong> Frequência de visitas e nível de responsabilidade no canteiro.
                    </p>
                    <ul className="space-y-2 text-slate-700">
                      <li><strong>1. Levantamento:</strong> Visita única para medição. Ocorre apenas antes do início do projeto, sem retornos durante a execução da obra.</li>
                      <li><strong>2. Pontual:</strong> Além do levantamento, envolve visitas estratégicas apenas em marcos críticos. Como na demarcação inicial (gabarito) e na entrega final.</li>
                      <li><strong>3. Por Etapas:</strong> Visitas de conferência ao fim de fases específicas. Como checar a conclusão da alvenaria, pontos de elétrica ou instalação de marcenaria.</li>
                      <li><strong>4. Acompanhamento:</strong> Rotina fixa de fiscalização. Exige visitas periódicas (semanais ou quinzenais) para garantir que a execução siga fielmente o projeto.</li>
                      <li><strong>5. Gestão:</strong> Administração completa da execução. Envolve compras de materiais, controle rigoroso de cronograma e gestão direta da equipe de mão de obra.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Seção 4 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-calcularq-blue" />
              </div>
              <h2 className="text-2xl font-bold text-calcularq-blue">
                4. Composição Final do Preço
              </h2>
            </div>
            <p className="text-slate-700 mb-6 text-center">
              Nesta última etapa, o sistema cruza os dados para calcular o Índice de Complexidade
              Global. Ele utiliza esse índice para transformar sua Hora Técnica Mínima em uma Hora Técnica
              Ajustada — um valor superior que remunera a dificuldade do trabalho. Essa taxa ajustada é a
              base para calcular o valor do projeto que, somado às despesas variáveis e ajustado pelo
              desconto aplicado, gera o Preço de Venda Final.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">O que você precisa preencher:</h3>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-calcularq-blue font-bold mt-1">●</span>
                    <div>
                      <strong>Estimativa de Horas de Projeto:</strong> Insira a quantidade total de horas que você estima
                      gastar para executar esse projeto.
                      <p className="text-sm text-slate-600 mt-1">
                        Como funciona: O sistema multiplicará essa estimativa pela sua Hora
                        Técnica Ajustada, ou seja, quanto mais complexo o projeto, mais cara
                        será a hora cobrada.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-calcularq-blue font-bold mt-1">●</span>
                    <div>
                      <strong>Despesas Variáveis:</strong> Utilize nossa lista dinâmica para adicionar custos específicos
                      deste contrato que serão repassados integralmente ao cliente.
                      <p className="text-sm text-slate-600 mt-1">
                        Exemplos: Taxas de registro (RRT/ART), custos logísticos como transporte e
                        alimentação, plotagens ou impostos sobre a nota fiscal.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-calcularq-blue font-bold mt-1">●</span>
                    <div>
                      <strong>Desconto:</strong> Utilize a barra deslizante para aplicar uma porcentagem de desconto sobre
                      os seus honorários. O sistema ajusta o preço do projeto e exibe o seu prejuízo (quanto dinheiro você está
                      abrindo mão) para que você negocie consciente do impacto no seu bolso.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                <h3 className="font-semibold text-calcularq-blue mb-3">O Resultado:</h3>
                <p className="text-slate-700 mb-3">
                  Ao concluir, o sistema apresenta o resumo financeiro do projeto com essas informações:
                </p>
                <ul className="space-y-2 text-slate-700">
                  <li>• Hora Técnica Mínima</li>
                  <li>• Índice de Complexidade Global</li>
                  <li>• Hora Técnica Ajustada: Quanto você está cobrando por hora neste projeto específico.</li>
                  <li>• Estimativa de Horas de Projeto</li>
                  <li>• Preço do Projeto: O valor referente apenas aos seus honorários.</li>
                  <li>• Total de Despesas Variáveis: A soma de todos os custos extras repassados ao cliente.</li>
                  <li>• Valor do Desconto: O valor subtraído dos seus honorários (caso tenha aplicado um desconto).</li>
                  <li>• Preço de Venda Final: O valor total da proposta para apresentar ao cliente.</li>
                  <li>• Lucro Estimado: O valor projetado que restará após cobrir as suas despesas fixas durante o tempo
                    estimado de projeto.</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Conclusão */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-calcularq-blue to-[#002366] rounded-2xl p-8 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Agora você está no controle.</h2>
            </div>
            <p className="text-lg leading-relaxed mb-4">
              Ao finalizar essas etapas, você deixa para trás a incerteza dos métodos convencionais de
              precificação que, muitas vezes, ignoram a real complexidade do seu trabalho. A CalculArq
              existe para validar matematicamente o seu esforço e sua valorização financeira.
            </p>
            <p className="text-lg leading-relaxed mb-4">
              Lembre-se: A Calcularq é sua aliada estratégica, entregando a segurança dos números para
              você negociar com firmeza. No entanto, lembre-se: o sistema define o preço justo, mas quem
              constrói o valor na mente do cliente é a sua apresentação.
            </p>
            <p className="text-xl font-bold">
              Vá para a reunião com a confiança de quem sabe quanto vale a sua hora técnica.
            </p>
            <p className="text-2xl font-bold mt-6 text-center">
              Bom projeto!
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
