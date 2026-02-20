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
  const navigate = useNavigate();  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkoutWindowRef = useRef<Window | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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
    };
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
      
      console.log(`🔍 Verificando pagamento - hasPaid: ${paymentStatus.hasPaid}, userId: ${user.id}`);
      
      if (paymentStatus.hasPaid) {
        // Pagamento confirmado!
        console.log("✅ Pagamento confirmado! hasPaid = true");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
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
      // (Novo backend) Não é necessário sincronizar usuário antes do pagamento.

      // Criar sessão via API (Stripe)
      const { url: checkoutUrl } = await api.createCheckoutSession();
      if (!checkoutUrl) throw new Error("Checkout não configurado");
      
      // Abrir checkout do Stripe
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
      // O webhook do Stripe deve atualizar o status no backend
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
        // O webhook pode levar alguns segundos para processar
        setTimeout(() => {
          if (pollIntervalRef.current) {
            // Continuar verificando por mais 60 segundos após fechar (aumentado)
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
              if (status === "pending") {
                setIsProcessing(false);
              }
            }, 60000); // 60 segundos adicionais (aumentado de 30)
          }
        }, 3000); // Aguardar 3 segundos antes de começar polling estendido
      }
    }, 1000);

    // Timeout de segurança (5 minutos)
    setTimeout(() => {
      clearInterval(checkClosed);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
        checkoutWindowRef.current.close();
      }
      if (status === "pending") {
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
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-calcularq-blue mb-2">
            Pagamento Confirmado!
          </h2>
          <p className="text-slate-600 mb-6">
            Seu acesso à calculadora foi liberado. Redirecionando...
          </p>
          <Loader className="w-6 h-6 animate-spin text-calcularq-blue mx-auto" />
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
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Erro no Pagamento
          </h2>
          <p className="text-slate-600 mb-4">
            Ocorreu um erro ao processar seu pagamento. Tente novamente.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Se o problema persistir, verifique se os pop-ups estão bloqueados ou entre em contato com o suporte.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setStatus("pending");
                setIsProcessing(false);
                handleStripeCheckout();
              }}
              className="bg-calcularq-blue hover:bg-[#002366] text-white"
            >
              Tentar Novamente
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Home"))}
              className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 lg:p-12"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-calcularq-blue flex items-center justify-center mx-auto mb-4">
              <img src="/logomarca-branca.png" alt="Calcularq" className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-calcularq-blue mb-4">
              Acesso à Calcularq
            </h1>
            <p className="text-lg text-slate-600">
              Para acessar a Calcularq, é necessário fazer um pagamento único de <strong className="text-calcularq-blue">R$19,90</strong>.
            </p>
          </div>

          <div className="bg-calcularq-blue/5 border border-calcularq-blue/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-calcularq-blue mb-4">
              O que você recebe:
            </h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Acesso completo à calculadora de precificação</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Cálculos ilimitados de precificação</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Histórico organizado dos seus cálculos</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            {/* Checkbox de aceite de termos */}
            <div className="mb-6 flex items-start justify-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-calcularq-blue border-slate-300 rounded focus:ring-calcularq-blue"
              />
              <label htmlFor="acceptTerms" className="cursor-pointer">
                Li e concordo com os{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-calcularq-blue hover:underline font-semibold"
                >
                  Termos de Uso
                </button>
                {" "}e a{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-calcularq-blue hover:underline font-semibold"
                >
                  Política de Privacidade
                </button>
                .
              </label>
            </div>

            <Button
              onClick={handleStripeCheckout}
              disabled={isProcessing || !acceptedTerms}
              className="text-white px-8 py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#fc7338' }}
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Realizar o pagamento"
              )}
            </Button>
            <p className="text-sm text-slate-500 mt-4">
              Pagamento seguro processado pela Stripe
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Após o pagamento, você será redirecionado automaticamente para a calculadora.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Legal Modals */}
      <LegalModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        title="Termos e Condições Gerais de Uso"
        content={termsContent}
      />
      
      <LegalModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Política de Privacidade e Proteção de Dados Pessoais"
        content={privacyContent}
      />
    </div>
  );
}
