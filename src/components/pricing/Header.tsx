import { Calculator } from "lucide-react";

export default function Header() {
  return (
    <div className="text-center mb-8 lg:mb-10">
      <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-slate-900 mb-3 lg:mb-4">
        <Calculator className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
      </div>
      <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2 lg:mb-3">
        Calculadora de Precificação
      </h1>
      <p className="text-base lg:text-lg text-slate-500 max-w-2xl mx-auto px-4">
        Configure os fatores de complexidade e parâmetros financeiros para 
        calcular o valor justo do seu projeto de arquitetura.
      </p>
    </div>
  );
}
