import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePayment?: boolean;
}

export default function ProtectedRoute({ children, requirePayment = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-calcularq-blue mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={createPageUrl("Login")} replace />;
  }

  if (requirePayment && !user.hasPaid) {
    return <Navigate to={createPageUrl("Payment")} replace />;
  }

  return <>{children}</>;
}
