import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Home, Calculator, FileText, Shield } from "lucide-react";
import { createPageUrl } from "@/utils";
import LegalModal from "./LegalModal";
import { termsContent, privacyContent } from "@/lib/legalContent";

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <footer className="bg-calcularq-blue text-white border-t border-[#002366]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Section - Logo, Navigation, Email */}
            <div className="space-y-4">
              <Link 
                to={createPageUrl("Home")}
                className="flex items-center gap-2.5"
              >
                <img 
                  src="/logo-branca.png" 
                  alt="Calcularq" 
                  className="h-10 w-auto object-contain logo-white"
                />
              </Link>
              
              {/* Navigation */}
              <nav className="space-y-2">
                <Link 
                  to={createPageUrl("Home")}
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
                <Link 
                  to={createPageUrl("Calculator")}
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  Calculadora
                </Link>
              </nav>
              
              {/* Termos e Política */}
              <nav className="space-y-2 mt-4">
                <button
                  onClick={() => setShowTerms(true)}
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors w-full text-left"
                >
                  <FileText className="w-4 h-4" />
                  Termos de Uso
                </button>
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors w-full text-left"
                >
                  <Shield className="w-4 h-4" />
                  Política de Privacidade
                </button>
              </nav>
              
              {/* Email */}
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Mail className="w-4 h-4" />
                <a 
                  href="mailto:atendimento@calcularq.com.br"
                  className="hover:text-white transition-colors"
                >
                  atendimento@calcularq.com.br
                </a>
              </div>
            </div>

            {/* Middle Section - Empty (removed as per specs) */}
            <div></div>

            {/* Right Section - About */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                Sobre
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                A Calcularq é uma ferramenta precisa que precifica projetos de arquitetura e interiores com cálculos automáticos baseados em horas técnicas e fatores de complexidade.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-white/60">
                <p>© {new Date().getFullYear()} <span className="text-white font-semibold">calcularq.com.br</span>. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

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
    </>
  );
}
