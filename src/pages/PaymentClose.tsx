import { useEffect } from "react";

export default function PaymentClose() {
  useEffect(() => {
    // Só fecha automaticamente se essa aba/janela foi aberta via window.open()
    window.close();
  }, []);

  // Sem tela (página “vazia”)
  return null;
}
