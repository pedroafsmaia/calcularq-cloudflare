import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calculator, Home, BookOpen, LogIn, LogOut, User, History } from "lucide-react";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();  
  const navigation = [
    { name: "Home", page: "Home", icon: Home },
    { name: "Calculadora", page: "Calculator", icon: Calculator },
  ];

  // Determina a página atual baseado na rota
  const getCurrentPageName = () => {
    const path = location.pathname.toLowerCase();
    if (path === "/" || path === "/home" || path.includes("home")) {
      return "Home";
    }
    if (path.includes("calculator") || path === "/calculator") {
      return "Calculator";
    }
    if (path.includes("manual") || path === "/manual") {
      return "Manual";
    }
    return "";
  };

  const currentPageName = getCurrentPageName();

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4 h-16 sm:h-16">
            {/* Logo - Logo completa em vez de logomarca */}
            <Link 
              to={createPageUrl("Home")}
              className="flex items-center shrink-0"
            >
              <img 
                src="/logo.png" 
                alt="Calcularq" 
                className="h-10 w-auto max-w-[160px] sm:max-w-none object-contain"
              />
            </Link>

            {/* Navigation Links */}
            <div className="min-w-0 flex-1">
            <div className="flex items-center justify-end gap-1.5 overflow-x-auto py-1">
              {navigation.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.page)}
                    className={`
                      shrink-0 flex items-center justify-center gap-2 h-11 min-w-11 sm:h-10 sm:min-w-10 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all border
                      ${isActive 
                        ? "bg-calcularq-blue text-white border-calcularq-blue shadow-sm shadow-calcularq-blue/20" 
                        : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-calcularq-blue"
                      }
                    `}
                  >
                    <item.icon className="w-[18px] h-[18px] sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
              
              {/* User Menu */}
              {user ? (
                <>
                  <Link
                    to="/budgets"
                    className="shrink-0 flex items-center justify-center gap-2 h-11 min-w-11 sm:h-10 sm:min-w-10 px-3 sm:px-4 py-2 rounded-xl border border-transparent text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-calcularq-blue transition-all"
                  >
                    <History className="w-[18px] h-[18px] sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Meus Cálculos</span>
                  </Link>
                  {/* Manual - só para usuários que pagaram */}
                  {user.hasPaid && (
                    <Link
                      to={createPageUrl("Manual")}
                      className={`shrink-0 flex items-center justify-center gap-2 h-11 min-w-11 sm:h-10 sm:min-w-10 px-3 sm:px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        currentPageName === "Manual"
                          ? "bg-calcularq-blue text-white border-calcularq-blue shadow-sm shadow-calcularq-blue/20"
                          : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-calcularq-blue"
                      }`}
                    >
                      <BookOpen className="w-[18px] h-[18px] sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Manual</span>
                    </Link>
                  )}
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="shrink-0 flex items-center justify-center gap-2 h-11 min-w-11 sm:h-10 sm:min-w-10 px-3 sm:px-4 py-2 rounded-xl border border-transparent text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-calcularq-blue transition-all"
                  >
                    <LogOut className="w-[18px] h-[18px] sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </>
              ) : (
                <Link
                  to={createPageUrl("Login")}
                  className="shrink-0 flex items-center justify-center gap-2 h-11 min-w-11 sm:h-10 sm:min-w-10 px-3 sm:px-4 py-2 rounded-xl border border-transparent text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-calcularq-blue transition-all"
                >
                  <LogIn className="w-[18px] h-[18px] sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              )}
            </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Legal Modals */}
    </div>
  );
}
