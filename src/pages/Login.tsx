import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { createPageUrl } from "@/utils";
import { api } from "@/lib/api";
import { fadeUp } from "@/lib/motion";
import AppDialog from "@/components/ui/AppDialog";

export default function Login() {
  const MIN_PASSWORD_LENGTH = 8;
  const prefersReducedMotion = !!useReducedMotion();
  const REMEMBER_ME_KEY = "calcularq_remember_me";
  const REMEMBER_ME_EMAIL_KEY = "calcularq_remember_me_email";
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { login, register, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const hasMinPasswordLength = password.length >= MIN_PASSWORD_LENGTH;

  useEffect(() => {
    if (!authLoading && user) {
      navigate(createPageUrl(user.hasPaid ? "Calculator" : "Payment"), { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (link) {
      link.href = "/logomarca.png";
    } else {
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.type = "image/png";
      newLink.href = "/logomarca.png";
      document.head.appendChild(newLink);
    }
    document.title = isLogin ? "Calcularq - Entrar" : "Calcularq - Criar conta";
  }, [isLogin]);

  useEffect(() => {
    try {
      const remembered = localStorage.getItem(REMEMBER_ME_KEY) === "1";
      const rememberedEmail = localStorage.getItem(REMEMBER_ME_EMAIL_KEY) ?? "";
      if (remembered && rememberedEmail) {
        setRememberMe(true);
        setEmail(rememberedEmail);
      }
    } catch {
      // no-op
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        try {
          if (rememberMe && email.trim()) {
            localStorage.setItem(REMEMBER_ME_KEY, "1");
            localStorage.setItem(REMEMBER_ME_EMAIL_KEY, email.trim());
          } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
            localStorage.removeItem(REMEMBER_ME_EMAIL_KEY);
          }
        } catch {
          // no-op
        }
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError("Nome é obrigatório");
          setIsLoading(false);
          return;
        }
        await register(email, password, name);
      }
      navigate(createPageUrl("Calculator"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message || message === "Erro desconhecido") {
        setError("Não foi possível concluir o login. Tente novamente.");
      } else if (message.includes("Failed to fetch")) {
        setError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 sm:py-12">
      <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" animate="show" className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg sm:shadow-xl border border-slate-200 p-6 sm:p-8">
          <div className="text-center mb-7 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-calcularq-blue mb-4">
              <img src="/logomarca-branca.png" alt="Calcularq" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-calcularq-blue mb-2">{isLogin ? "Entrar" : "Criar conta"}</h1>
            <p className="text-slate-600 leading-relaxed max-w-[30ch] mx-auto">
              {isLogin
                ? "Acesse sua conta para usar a calculadora e salvar seus cálculos"
                : "Crie sua conta gratuitamente para acessar a calculadora"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                    placeholder="Seu nome"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className={`mt-2 text-xs ${hasMinPasswordLength ? "text-emerald-700" : "text-slate-500"}`}>
                  Requisito: mínimo de {MIN_PASSWORD_LENGTH} caracteres.
                </p>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-calcularq-blue focus:ring-2 focus:ring-calcularq-blue/20 focus:ring-offset-0"
                  />
                  Lembrar meu e-mail
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-calcularq-blue hover:underline underline-offset-4"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            <Button type="submit" disabled={isLoading} className="w-full bg-calcularq-blue hover:bg-[#002366] text-white py-6 text-lg font-semibold">
              {isLoading ? (
                "Processando..."
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Criar conta
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-sm text-calcularq-blue hover:underline underline-offset-4"
            >
              {isLogin ? "Não tem uma conta? Criar conta" : "Já tem uma conta? Fazer login"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link to={createPageUrl("Home")} className="text-sm text-slate-500 hover:text-calcularq-blue">
              ← Voltar para Home
            </Link>
          </div>
        </div>
      </motion.div>

      <AppDialog
        open={showForgotPassword}
        onOpenChange={(open) => {
          setShowForgotPassword(open);
          if (!open) {
            setForgotPasswordEmail("");
            setForgotPasswordMessage(null);
          }
        }}
        title="Esqueci minha senha"
        description="Digite seu e-mail cadastrado. Enviaremos um link para redefinir sua senha."
        maxWidthClassName="max-w-md"
        footer={
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordEmail("");
                setForgotPasswordMessage(null);
              }}
              className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                setForgotPasswordMessage(null);
                if (!forgotPasswordEmail || !forgotPasswordEmail.includes("@")) {
                  setForgotPasswordMessage({ type: "error", text: "Por favor, digite um e-mail válido." });
                  return;
                }
                try {
                  setIsLoading(true);
                  const response = await api.forgotPassword(forgotPasswordEmail);
                  setForgotPasswordMessage({
                    type: "success",
                    text: response.message || "Se o e-mail existir, você receberá instruções para redefinir sua senha.",
                  });
                  setTimeout(() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                    setForgotPasswordMessage(null);
                  }, 5000);
                } catch (err) {
                  console.error("Erro ao solicitar reset de senha:", err);
                  setForgotPasswordMessage({
                    type: "error",
                    text: err instanceof Error ? err.message : "Erro ao processar solicitação. Tente novamente.",
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              className="flex-1 bg-calcularq-blue hover:bg-[#002366] text-white"
            >
              {isLoading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {forgotPasswordMessage ? (
            <div
              className={`p-3 rounded-lg ${
                forgotPasswordMessage.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {forgotPasswordMessage.text}
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>
        </div>
      </AppDialog>
    </div>
  );
}


