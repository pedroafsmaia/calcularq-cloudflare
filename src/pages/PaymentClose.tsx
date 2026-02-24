import { useEffect, useState } from "react";

export default function PaymentClose() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Tenta fechar o popup automaticamente (funciona quando aberto via window.open)
    window.close();

    // Se após 800ms a janela ainda estiver aberta, o usuário acessou diretamente
    const timer = setTimeout(() => setShowFallback(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!showFallback) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-8 text-center font-sans">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-calcularq-blue">Pagamento realizado!</h2>
        <p className="text-slate-500">Você pode fechar esta aba e voltar ao aplicativo.</p>
      </div>
    </div>
  );
}
