import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPageUrl } from "@/utils";
import { Calculator, Home, BookOpen, LogIn, LogOut, User, History, LayoutDashboard, ChevronDown } from "lucide-react";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    else if (path === "/budgets" || path.includes("budgets")) pageTitle = "Meus cálculos";
    else if (path === "/login" || path.includes("/login")) pageTitle = "Entrar";
    else if (path === "/reset-password" || path.includes("reset-password")) pageTitle = "Redefinir Senha";
    else if (path === "/payment" || path.includes("/payment")) pageTitle = "Pagamento";

    document.title = pageTitle ? `Calcularq - ${pageTitle}` : "Calcularq";
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  const desktopNavItem = (isActive: boolean) =>
    `shrink-0 flex items-center justify-center gap-0 xl:gap-2 h-10 w-10 xl:w-auto min-w-10 xl:min-w-10 px-0 xl:px-4 py-2 rounded-xl text-sm font-medium transition-colors transition-shadow duration-150 border ${
      isActive
        ? "bg-calcularq-blue text-white border-calcularq-blue shadow-sm shadow-calcularq-blue/20"
        : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-calcularq-blue"
    }`;

  const mobileIconItem = (isActive = false) =>
    `shrink-0 flex items-center justify-center h-10 w-10 rounded-xl border transition-colors transition-shadow duration-150 ${
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
                      <span className="hidden xl:inline">Meus cálculos</span>
                    </Link>

                    {user.hasPaid && (
                      <Link to={createPageUrl("Manual")} className={desktopNavItem(currentPageName === "Manual")}>
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden xl:inline">Manual</span>
                      </Link>
                    )}

                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => setUserMenuOpen((v) => !v)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-calcularq-blue transition-colors duration-150 border border-transparent"
                      >
                        <User className="w-4 h-4" />
                        <span className="hidden 2xl:inline">{user.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 hidden 2xl:inline" />
                      </button>

                      {userMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg z-50 py-1">
                          <div className="px-4 py-2.5 text-xs text-slate-500">
                            <span className="block font-medium text-slate-700 text-sm">{user.name}</span>
                            {user.email}
                          </div>
                          <div className="border-t border-slate-200 my-1" />
                          {user.isAdmin && (
                            <Link
                              to={createPageUrl("Admin")}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-calcularq-blue transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard administrativo
                            </Link>
                          )}
                          <button
                            onClick={() => { setUserMenuOpen(false); logout(); }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sair
                          </button>
                        </div>
                      )}
                    </div>
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

                    {user.isAdmin && (
                      <Link to={createPageUrl("Admin")} className={mobileIconItem()} aria-label="Dashboard administrativo">
                        <LayoutDashboard className="w-[18px] h-[18px]" />
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
