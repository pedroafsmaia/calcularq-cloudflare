import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-slate-50 px-4 py-16">
          <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center justify-center">
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-calcularq-blue">Algo deu errado</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                Ocorreu um erro inesperado ao carregar esta tela. Tente recarregar a pagina.
              </p>
              <div className="mt-6 flex justify-center">
                <Button type="button" onClick={this.handleReload}>
                  Recarregar pagina
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
