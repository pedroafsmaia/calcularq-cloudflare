import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
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

  const getCurrentPageName = () => {
    const path = location.pathname.toLowerCase();
    if (path === "/" || path === "/home" || path.includes("home")) return "Home";
    if (path.includes("calculator") || path === "/calculator") return "Calculator";
    if (path.includes("manual") || path === "/manual") return "Manual";
    return "";
  };

  const currentPageName = getCurrentPageName();

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    let pageTitle = "";

    if (path === "/" || path === "/home" || path.includes("home")) pageTitle = "Home";
    else if (path === "/calculator" || path.includes("calculator")) pageTitle = "Calculadora";
    else if (path === "/manual" || path.includes("manual")) pageTitle = "Manual";
    else if (path === "/budgets" || path.includes("budgets")) pageTitle = "Meus Cálculos";
    else if (path === "/login" || path.includes("/login")) pageTitle = "Entrar";
    else if (path === "/reset-password" || path.includes("reset-password")) pageTitle = "Redefinir Senha";
    else if (path === "/payment" || path.includes("/payment")) pageTitle = "Pagamento";

    document.title = pageTitle ? `Calcularq - ${pageTitle}` : "Calcularq";
  }, [location.pathname]);

  const desktopNavItem = (isActive: boolean) =>
    `shrink-0 flex items-center justify-center gap-0 xl:gap-2 h-10 w-10 xl:w-auto min-w-10 xl:min-w-10 px-0 xl:px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
      isActive
        ? "bg-calcularq-blue text-white border-calcularq-blue shadow-sm shadow-calcularq-blue/20"
        : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-calcularq-blue"
    }`;

  const mobileIconItem = (isActive = false) =>
    `shrink-0 flex items-center justify-center h-10 w-10 rounded-xl border transition-all ${
      isActive
        ? "bg-calcularq-blue text-white border-calcularq-blue shadow-sm shadow-calcularq-blue/20"
        : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-calcularq-blue"
    }`;

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4 h-16">
            <Link to={createPageUrl("Home")} className="flex items-center shrink-0">
              <img
                src="/logo.png"
                alt="Calcularq"
                className="h-10 w-auto max-w-[160px] sm:max-w-none object-contain"
              />
            </Link>

            <div className="hidden sm:block min-w-0 flex-1">
              <div className="flex items-center justify-end gap-1.5 overflow-x-auto py-1">
                {navigation.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link key={item.name} to={createPageUrl(item.page)} className={desktopNavItem(isActive)}>
                      <item.icon className="w-4 h-4" />
                      <span className="hidden xl:inline">{item.name}</span>
                    </Link>
                  );
                })}

                {user ? (
                  <>
                    <Link to="/budgets" className={desktopNavItem(false)}>
                      <History className="w-4 h-4" />
                      <span className="hidden xl:inline">Meus Cálculos</span>
                    </Link>

                    {user.hasPaid && (
                      <Link to={createPageUrl("Manual")} className={desktopNavItem(currentPageName === "Manual")}>
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden xl:inline">Manual</span>
                      </Link>
                    )}

                    <div className="hidden 2xl:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600">
                      <User className="w-4 h-4" />
                      <span>{user.name}</span>
                    </div>

                    <button onClick={logout} className={desktopNavItem(false)}>
                      <LogOut className="w-4 h-4" />
                      <span className="hidden xl:inline">Sair</span>
                    </button>
                  </>
                ) : (
                  <Link to={createPageUrl("Login")} className={desktopNavItem(false)}>
                    <LogIn className="w-4 h-4" />
                    <span className="hidden xl:inline">Entrar</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="sm:hidden min-w-0 flex-1">
              <div className="flex items-center justify-end gap-1.5 overflow-x-auto py-1">
                {navigation.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link key={item.name} to={createPageUrl(item.page)} className={mobileIconItem(isActive)} aria-label={item.name}>
                      <item.icon className="w-[18px] h-[18px]" />
                    </Link>
                  );
                })}

                {user ? (
                  <>
                    <Link to="/budgets" className={mobileIconItem()} aria-label="Meus cálculos">
                      <History className="w-[18px] h-[18px]" />
                    </Link>

                    {user.hasPaid && (
                      <Link
                        to={createPageUrl("Manual")}
                        className={mobileIconItem(currentPageName === "Manual")}
                        aria-label="Manual"
                      >
                        <BookOpen className="w-[18px] h-[18px]" />
                      </Link>
                    )}

                    <button onClick={logout} className={mobileIconItem()} aria-label="Sair">
                      <LogOut className="w-[18px] h-[18px]" />
                    </button>
                  </>
                ) : (
                  <Link to={createPageUrl("Login")} className={mobileIconItem()} aria-label="Entrar">
                    <LogIn className="w-[18px] h-[18px]" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">{children}</main>

      <Footer />
    </div>
  );
}
