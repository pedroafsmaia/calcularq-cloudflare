import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { api } from "@/lib/api";
import { fadeUp } from "@/lib/motion";

export default function ResetPassword() {
  const prefersReducedMotion = !!useReducedMotion();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Calcularq - Redefinir Senha";
    if (!token) setError("Token inválido. Verifique o link recebido por e-mail.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token inválido.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.resetPassword(token, password);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => navigate(createPageUrl("Login")), 3000);
      } else {
        setError("Token inválido ou expirado.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" animate="show" className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg sm:shadow-xl border border-slate-200 p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-calcularq-blue mb-4">Senha redefinida!</h1>
            <p className="text-slate-600 mb-6">
              Sua senha foi redefinida com sucesso. Você será redirecionado para o login.
            </p>
            <Link to={createPageUrl("Login")} className="text-calcularq-blue hover:underline">
              Ir para login agora →
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 sm:py-12">
      <motion.div variants={fadeUp(prefersReducedMotion, 14)} initial="hidden" animate="show" className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg sm:shadow-xl border border-slate-200 p-6 sm:p-8">
          <div className="text-center mb-7 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-calcularq-blue mb-4">
              <img src="/logomarca-branca.png" alt="Calcularq" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-calcularq-blue mb-2">Redefinir senha</h1>
            <p className="text-slate-600 leading-relaxed max-w-[28ch] mx-auto">Digite sua nova senha abaixo.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !token}
              className="w-full bg-calcularq-blue hover:bg-[#002366] text-white py-6 text-lg font-semibold"
            >
              {isLoading ? "Processando..." : "Redefinir senha"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to={createPageUrl("Login")} className="text-sm text-slate-500 hover:text-calcularq-blue">
              ← Voltar para Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
