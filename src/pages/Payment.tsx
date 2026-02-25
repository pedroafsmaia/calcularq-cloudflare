import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import LegalModal from "@/components/LegalModal";
import { termsContent, privacyContent } from "@/lib/legalContent";
import { fadeUp } from "@/lib/motion";

const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 60;

export default function Payment() {
  const prefersReducedMotion = !!useReducedMotion();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkClosedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkoutWindowRef = useRef<Window | null>(null);
  const pollAttemptsRef = useRef(0);
  const statusRef = useRef<"pending" | "success" | "error">("pending");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const closeCheckoutWindow = () => {
    try {
      if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
        checkoutWindowRef.current.close();
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user?.hasPaid && !isProcessing) {
      navigate(createPageUrl("Calculator"), { replace: true });
    }
  }, [user, navigate, isProcessing]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (checkClosedRef.current) clearInterval(checkClosedRef.current);
      closeCheckoutWindow();
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

    pollAttemptsRef.current += 1;
    if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
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
      if (paymentStatus.hasPaid) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (checkClosedRef.current) {
          clearInterval(checkClosedRef.current);
          checkClosedRef.current = null;
        }

        closeCheckoutWindow();

        try {
          await refreshUser();
        } catch (refreshError) {
          console.error("Erro ao atualizar usuário:", refreshError);
        }

        setStatus("success");
        setIsProcessing(false);

        setTimeout(() => {
          navigate(createPageUrl("Calculator"), { replace: true });
        }, 1000);
      }
    } catch (error) {
      console.error("Erro ao verificar status de pagamento:", error);
    }
  };

  const handleStripeCheckout = async () => {
    if (!user) {
      navigate(createPageUrl("Login"), { replace: true });
      return;
    }

    if (!acceptedTerms) {
      setInlineError("Por favor, aceite os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }

    setInlineError(null);
    setIsProcessing(true);
    setStatus("pending");

    try {
      const { url: checkoutUrl } = await api.createCheckoutSession();
      if (!checkoutUrl) throw new Error("Checkout não configurado");

      checkoutWindowRef.current = window.open(checkoutUrl, "_blank", "width=600,height=700");
      if (!checkoutWindowRef.current) {
        setInlineError("Por favor, permita pop-ups para este site para realizar o pagamento.");
        setIsProcessing(false);
        return;
      }

      pollAttemptsRef.current = 0;
      pollIntervalRef.current = setInterval(() => {
        void checkPaymentStatus();
      }, POLL_INTERVAL);

      void checkPaymentStatus();

      checkClosedRef.current = setInterval(() => {
        if (checkoutWindowRef.current?.closed) {
          if (checkClosedRef.current) {
            clearInterval(checkClosedRef.current);
            checkClosedRef.current = null;
          }
          void checkPaymentStatus();
        }
      }, 1000);

      setTimeout(() => {
        if (checkClosedRef.current) {
          clearInterval(checkClosedRef.current);
          checkClosedRef.current = null;
        }
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        closeCheckoutWindow();
        if (statusRef.current === "pending") {
          setIsProcessing(false);
        }
      }, 300000);
    } catch (error: unknown) {
      console.error("Erro ao iniciar checkout:", error);
      setStatus("error");
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Você precisa estar logado para realizar o pagamento.</p>
          <Button onClick={() => navigate(createPageUrl("Login"))} className="bg-calcularq-blue hover:bg-[#002366] text-white">
            Fazer login
          </Button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.18 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-calcularq-blue mb-2">Pagamento confirmado!</h2>
          <p className="text-slate-600 mb-6">Seu acesso à calculadora foi liberado. Redirecionando...</p>
          <Loader className="w-6 h-6 animate-spin text-calcularq-blue mx-auto" />
        </motion.div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.18 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro no pagamento</h2>
          <p className="text-slate-600 mb-4">Ocorreu um erro ao processar seu pagamento. Tente novamente.</p>
          <p className="text-sm text-slate-500 mb-6">
            Se o problema persistir, verifique se os pop-ups estão bloqueados ou entre em contato com o suporte.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                pollAttemptsRef.current = 0;
                setStatus("pending");
                setIsProcessing(false);
                void handleStripeCheckout();
              }}
              className="bg-calcularq-blue hover:bg-[#002366] text-white"
            >
              Tentar novamente
            </Button>
            <Button onClick={() => navigate(createPageUrl("Home"))} className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
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
        <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" animate="show" className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 lg:p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-calcularq-blue flex items-center justify-center mx-auto mb-4">
              <img src="/logomarca-branca.png" alt="Calcularq" className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-calcularq-blue mb-4">Acesso à Calcularq</h1>
            <p className="text-lg text-slate-600">
              Para acessar a Calcularq, é necessário fazer um pagamento único de <strong className="text-calcularq-blue">R$19,90</strong>.
            </p>
          </div>

          <div className="bg-calcularq-blue/5 border border-calcularq-blue/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-calcularq-blue mb-4">O que você recebe:</h2>
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
            {inlineError ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
                {inlineError}
              </div>
            ) : null}

            <div className="mb-6 flex items-start justify-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-calcularq-blue border-slate-300 rounded focus:ring-2 focus:ring-calcularq-blue/20 focus:ring-offset-0"
              />
              <label htmlFor="acceptTerms" className="cursor-pointer">
                Li e concordo com os{" "}
                <button type="button" onClick={() => setShowTerms(true)} className="text-calcularq-blue hover:underline font-semibold">
                  Termos de Uso
                </button>{" "}
                e a{" "}
                <button type="button" onClick={() => setShowPrivacy(true)} className="text-calcularq-blue hover:underline font-semibold">
                  Política de Privacidade
                </button>
                .
              </label>
            </div>

            <Button
              onClick={() => void handleStripeCheckout()}
              disabled={isProcessing || !acceptedTerms}
              className="bg-[#fc7338] hover:bg-[#f26628] text-white px-8 py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-sm text-slate-500 mt-4">Pagamento seguro processado pela Stripe</p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Após o pagamento, você será redirecionado automaticamente para a calculadora.
            </p>
          </div>
        </motion.div>
      </div>

      <LegalModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Termos e Condições Gerais de Uso" content={termsContent} />
      <LegalModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Política de Privacidade e Proteção de Dados Pessoais"
        content={privacyContent}
      />
    </div>
  );
}
