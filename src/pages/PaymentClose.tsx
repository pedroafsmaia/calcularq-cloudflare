import { useEffect, useState } from "react";

export default function PaymentClose() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Tenta fechar o popup automaticamente (funciona quando aberto via window.open)
    window.close();

    // Se após 800ms a janela ainda estiver aberta, o usuário acessou diretamente — exibir mensagem
    const timer = setTimeout(() => setShowFallback(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!showFallback) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", textAlign: "center", padding: "2rem" }}>
      <div>
        <h2 style={{ marginBottom: "0.5rem" }}>Pagamento realizado!</h2>
        <p style={{ color: "#555" }}>Você pode fechar esta aba e voltar ao aplicativo.</p>
      </div>
    </div>
  );
}
