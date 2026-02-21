import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import LegalModal from "@/components/LegalModal";
import { termsContent, privacyContent } from "@/lib/legalContent";

// Usar API para criar sessão (garante client_reference_id)
// Fallback para link direto se API não estiver disponível
const POLL_INTERVAL = 3000; // Verificar a cada 3 segundos
const MAX_POLL_ATTEMPTS = 60; // Máximo de 3 minutos

export default function Payment() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkoutWindowRef = useRef<Window | null>(null);
  const statusRef = useRef<"pending" | "success" | "error">("pending");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Mantém um "ref" com o status mais recente (evita status stale em setTimeout)
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const closeCheckoutWindow = () => {
    try {
      if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
        checkoutWindowRef.current.close();
      }
    } catch (_) {
      // ignorar
    }
  };

  // Verificar se já pagou
  useEffect(() => {
    if (user?.hasPaid) {
      navigate(createPageUrl("Calculator"), { replace: true });
    }
  }, [user, navigate]);

  // Limpar interval ao desmontar
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      closeCheckoutWindow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPaymentStatus = async () => {
    if (!user) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    if (pollAttempts >= MAX_POLL_ATTEMPTS) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setStatus("error");
      setIsProcessing(false);
      return;
    }

    try {
      const paymentStatus = await api.getPaymentStatus();

      console.log(
        `🔍 Verificando pagamento - hasPaid: ${paymentStatus.hasPaid}, userId: ${user.id}`
      );

      if (paymentStatus.hasPaid) {
        // Pagamento confirmado!
        console.log("✅ Pagamento confirmado! hasPaid = true");

        // Para polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        // FECHA a janela/aba do checkout imediatamente
        closeCheckoutWindow();

        // Atualizar usuário local e no contexto
        try {
          await refreshUser();
          console.log("✅ Usuário atualizado no contexto");
        } catch (refreshError) {
          console.error("Erro ao atualizar usuário:", refreshError);
          // Continuar mesmo se refresh falhar
        }

        setStatus("success");
        setIsProcessing(false);

        // Redirecionar após 1 segundo
        setTimeout(() => {
          navigate(createPageUrl("Calculator"), { replace: true });
        }, 1000);
      } else {
        const attempts = pollAttempts + 1;
        setPollAttempts(attempts);

        if (attempts % 10 === 0) {
          // A cada 10 tentativas, logar para debug
          console.log(`⏳ Aguardando confirmação... Tentativa ${attempts}/${MAX_POLL_ATTEMPTS}`);
          console.log(`   Status atual: hasPaid = ${paymentStatus.hasPaid}`);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status de pagamento:", error);
      setPollAttempts((prev: number) => prev + 1);
    }
  };

  const handleStripeCheckout = async () => {
    if (!user) {
      navigate(createPageUrl("Login"), { replace: true });
      return;
    }

    if (!acceptedTerms) {
      alert("Por favor, aceite os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }

    setIsProcessing(true);
    setStatus("pending");

    try {
      // Criar sessão via API (Stripe)
      const { url: checkoutUrl } = await api.createCheckoutSession();
      if (!checkoutUrl) throw new Error("Checkout não configurado");

      // Abrir checkout do Stripe em nova aba/janela
      checkoutWindowRef.current = window.open(
        checkoutUrl,
        "_blank",
        "width=600,height=700"
      );

      if (!checkoutWindowRef.current) {
        alert("Por favor, permita pop-ups para este site para realizar o pagamento.");
        setIsProcessing(false);
        return;
      }

      setPollAttempts(0);

      // Iniciar polling para verificar status de pagamento
      pollIntervalRef.current = setInterval(() => {
        checkPaymentStatus();
      }, POLL_INTERVAL);

      // Verificar imediatamente
      checkPaymentStatus();
    } catch (error: any) {
      console.error("❌ Erro ao iniciar checkout:", error);
      setStatus("error");
      setIsProcessing(false);

      // Mostrar erro mais específico no console para debug
      if (error?.message) {
        console.error("Detalhes do erro:", error.message);
      }
      return; // Sair se houver erro
    }

    // Monitorar quando a janela fechar
    const checkClosed = setInterval(() => {
      if (checkoutWindowRef.current?.closed) {
        clearInterval(checkClosed);
        console.log("🪟 Janela do checkout fechada, continuando verificação...");

        // Verificar imediatamente quando a janela fecha
        checkPaymentStatus();

        // Continuar verificando por mais tempo caso o webhook ainda não tenha processado
        setTimeout(() => {
          if (pollIntervalRef.current) {
            // Continuar verificando por mais 60 segundos após fechar
            const extendedPolling = setInterval(() => {
              checkPaymentStatus();
            }, POLL_INTERVAL);

            setTimeout(() => {
              clearInterval(extendedPolling);
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }

              // Se ainda estiver pendente após todo esse tempo, apenas encerra a espera
              if (statusRef.current === "pending") {
                setIsProcessing(false);
              }
            }, 60000);
          }
        }, 3000);
      }
    }, 1000);

    // Timeout de segurança (5 minutos)
    setTimeout(() => {
      clearInterval(checkClosed);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Se a janela ainda estiver aberta, fecha
      closeCheckoutWindow();

      if (statusRef.current === "pending") {
        setIsProcessing(false);
      }
    }, 300000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Você precisa estar logado para realizar o pagamento</p>
          <Button
            onClick={() => navigate(createPageUrl("Login"))}
            className="bg-calcularq-blue hover:bg-[#002366] text-white"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center"
        >
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Pagamento confirmado!</h2>
          <p className="text-slate-600 mb-6">
            Seu acesso foi liberado. Você será redirecionado para a calculadora.
          </p>
          <div className="flex justify-center">
            <Loader className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center"
        >
          <div className="flex justify-center mb-6">
            <XCircle className="w-16 h-16 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Algo deu errado</h2>
          <p className="text-slate-600 mb-6">
            Não conseguimos confirmar seu pagamento. Se você acabou de pagar, aguarde alguns segundos e tente novamente.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setStatus("pending");
                setIsProcessing(false);
                setPollAttempts(0);
              }}
              className="bg-calcularq-blue hover:bg-[#002366] text-white"
            >
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Calculator"), { replace: true })}
            >
              Voltar
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // status === "pending"
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full"
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Liberar acesso</h2>
        <p className="text-slate-600 mb-6 text-center">
          Para usar o Calcularq, conclua o pagamento único.
        </p>

        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-2 text-slate-700 text-sm">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1"
            />
            <span>
              Eu li e aceito os{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="underline text-calcularq-blue"
              >
                Termos de Uso
              </button>{" "}
              e a{" "}
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="underline text-calcularq-blue"
              >
                Política de Privacidade
              </button>
              .
            </span>
          </label>
        </div>

        <Button
          onClick={handleStripeCheckout}
          disabled={isProcessing}
          className="w-full bg-calcularq-blue hover:bg-[#002366] text-white"
        >
          {isProcessing ? "Processando..." : "Pagar e liberar acesso"}
        </Button>

        {isProcessing && (
          <div className="mt-4 flex items-center justify-center gap-2 text-slate-600 text-sm">
            <Loader className="w-4 h-4 animate-spin" />
            <span>Aguardando confirmação do pagamento…</span>
          </div>
        )}

        <LegalModal
          open={showTerms}
          onOpenChange={setShowTerms}
          title="Termos de Uso"
          content={termsContent}
        />

        <LegalModal
          open={showPrivacy}
          onOpenChange={setShowPrivacy}
          title="Política de Privacidade"
          content={privacyContent}
        />
      </motion.div>
    </div>
  );
}
