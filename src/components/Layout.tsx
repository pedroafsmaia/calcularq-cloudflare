import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef } from "react";
import { createPageUrl } from "@/utils";
import { Calculator, Home, BookOpen, LogIn, LogOut, History } from "lucide-react";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
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
  const headerRowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const row = headerRowRef.current;
    if (!row) return;

    const checkOverlap = () => {
      if (window.matchMedia("(min-width: 640px)").matches) return;

      const logoImg = row.querySelector("[data-mobile-logo]") as HTMLElement;
      const logomarcaImg = row.querySelector("[data-mobile-logomarca]") as HTMLElement;
      const navInner = row.querySelector("[data-mobile-nav]") as HTMLElement;

      if (!logoImg || !logomarcaImg || !navInner) return;

      // Show full logo first to measure whether it causes nav overflow
      logoImg.style.display = "";
      logomarcaImg.style.display = "none";

      // Read offsetWidth to force the browser to recalculate layout
      // before checking scrollWidth vs clientWidth below
      void navInner.offsetWidth;

      if (navInner.scrollWidth > navInner.clientWidth) {
        // Buttons overflow — switch to logomarca
        logoImg.style.display = "none";
        logomarcaImg.style.display = "";
      }
    };

    checkOverlap();
    window.addEventListener("resize", checkOverlap);

    const images = row.querySelectorAll<HTMLImageElement>(
      "img[data-mobile-logo], img[data-mobile-logomarca]"
    );
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", checkOverlap);
    });

    return () => {
      window.removeEventListener("resize", checkOverlap);
      images.forEach((img) => img.removeEventListener("load", checkOverlap));
    };
  }, [user, location.pathname]);

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
          <div ref={headerRowRef} className="flex items-center gap-2 sm:gap-4 h-16">
            <Link to={createPageUrl("Home")} className="flex items-center shrink-0">
              <img
                src="/logo.png"
                alt="Calcularq"
                className="h-10 w-auto sm:hidden object-contain"
                data-mobile-logo
              />
              <img
                src="/logomarca.png"
                alt="Calcularq"
                className="h-10 w-auto sm:hidden object-contain"
                data-mobile-logomarca
                style={{ display: "none" }}
              />
              <img
                src="/logo.png"
                alt="Calcularq"
                className="h-10 w-auto hidden sm:block object-contain"
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

                    <span
                      role={user.isAdmin ? "button" : undefined}
                      tabIndex={user.isAdmin ? 0 : undefined}
                      onClick={() => {
                        if (user.isAdmin) navigate(createPageUrl("Admin"));
                      }}
                      onKeyDown={(e) => {
                        if (user.isAdmin && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          navigate(createPageUrl("Admin"));
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 transition-colors duration-150 border border-transparent ${user.isAdmin ? "hover:bg-slate-100 hover:text-calcularq-blue cursor-pointer" : ""}`}
                    >
                      <span className="inline max-w-[120px] truncate">{user.name}</span>
                    </span>

                    <button onClick={logout} className={desktopNavItem(false)} aria-label="Sair">
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
              <div className="flex items-center justify-end gap-1.5 overflow-x-auto py-1" data-mobile-nav>
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
