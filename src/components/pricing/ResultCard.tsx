import { CheckCircle2, TrendingUp, DollarSign, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface ResultCardProps {
  results: {
    globalComplexity: number;
    adjustedHourlyRate: number;
    totalValue: number;
    baseValue: number;
    complexityMultiplier: number;
  };
  isValid: boolean;
}

export default function ResultCard({ results, isValid }: ResultCardProps) {
  if (!isValid) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">
            Preencha os campos para ver o resultado
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-5 lg:p-6 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-white">Resultado</h3>
      </div>

      <div className="space-y-4">
        {/* Complexidade Global */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Complexidade Global</span>
            <span className="text-lg font-bold text-white">
              {results.globalComplexity}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(results.globalComplexity / 5) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="bg-emerald-400 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Taxa Ajustada */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Taxa Horária Ajustada</span>
            </div>
            <span className="text-lg font-bold text-white">
              R$ {results.adjustedHourlyRate.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Valor Base */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Valor Base</span>
            <span className="text-base text-slate-300">
              R$ {results.baseValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Valor Total */}
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Valor Total do Projeto</span>
            </div>
            <span className="text-2xl font-bold text-white">
              R$ {results.totalValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
