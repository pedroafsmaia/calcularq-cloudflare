import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, UserPlus, Mail, Lock, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { api } from "@/lib/api";

export default function Login() {
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

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!authLoading && user) {
      if (user.hasPaid) {
        navigate(createPageUrl("Calculator"), { replace: true });
      } else {
        navigate(createPageUrl("Payment"), { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  // Atualizar favicon
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
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
      setError(err instanceof Error ? err.message : "Erro ao realizar operação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg sm:shadow-xl border border-slate-200 p-6 sm:p-8">
          {/* Logo */}
          <div className="text-center mb-7 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-calcularq-blue mb-4">
              <img src="/logomarca-branca.png" alt="Calcularq" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-calcularq-blue mb-2">
              {isLogin ? "Entrar" : "Criar conta"}
            </h1>
            <p className="text-slate-600 leading-relaxed max-w-[30ch] mx-auto">
              {isLogin 
                ? "Acesse sua conta para usar a calculadora e salvar seus cálculos"
                : "Crie sua conta gratuitamente para acessar a calculadora"
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue"
                    placeholder="Seu nome"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-calcularq-blue focus:ring-calcularq-blue"
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-calcularq-blue hover:bg-[#002366] text-white py-6 text-lg font-semibold"
            >
              {isLoading ? (
                "Processando..."
              ) : (
                <>
                  {isLogin ? (
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
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-sm text-calcularq-blue hover:underline underline-offset-4"
            >
              {isLogin 
                ? "Não tem uma conta? Criar conta"
                : "Já tem uma conta? Fazer login"
              }
            </button>
          </div>

          {/* Back to home */}
          <div className="mt-4 text-center">
            <Link
              to={createPageUrl("Home")}
              className="text-sm text-slate-500 hover:text-calcularq-blue"
            >
              ← Voltar para Home
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Modal Esqueci minha senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg sm:shadow-xl border border-slate-200 p-6 sm:p-8 max-w-md w-full"
          >
            <div className="text-center mb-6 sm:mb-7">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-calcularq-blue mb-4">
                <img src="/logomarca-branca.png" alt="Calcularq" className="w-7 h-7 object-contain" />
              </div>
              <h2 className="text-2xl sm:text-[1.75rem] font-bold text-calcularq-blue mb-2">
                Esqueci minha senha
              </h2>
              <p className="text-slate-600 leading-relaxed max-w-[30ch] mx-auto">
                Digite seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.
              </p>
            </div>

            {forgotPasswordMessage && (
              <div className={`p-3 rounded-lg mb-4 ${
                forgotPasswordMessage.type === "success" 
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {forgotPasswordMessage.text}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setForgotPasswordMessage(null);

                if (!forgotPasswordEmail || !forgotPasswordEmail.includes("@")) {
                  setForgotPasswordMessage({
                    type: "error",
                    text: "Por favor, digite um e-mail válido."
                  });
                  return;
                }

                try {
                  setIsLoading(true);
                  const response = await api.forgotPassword(forgotPasswordEmail);
                  setForgotPasswordMessage({
                    type: "success",
                    text: response.message || "Se o email existir, você receberá instruções para redefinir sua senha."
                  });

                  // Limpar após 5 segundos
                  setTimeout(() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                    setForgotPasswordMessage(null);
                  }, 5000);
                } catch (err) {
                  console.error('Erro ao solicitar reset de senha:', err);
                  setForgotPasswordMessage({
                    type: "error",
                    text: err instanceof Error ? err.message : "Erro ao processar solicitação. Tente novamente."
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

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
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-calcularq-blue hover:bg-[#002366] text-white"
                >
                  {isLoading ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
