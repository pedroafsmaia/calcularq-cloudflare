import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";
import { PageLoadingState } from "@/components/ui/LoadingStates";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePayment?: boolean;
}

export default function ProtectedRoute({ children, requirePayment = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoadingState label="Carregando..." />;
  }

  if (!user) {
    return <Navigate to={createPageUrl("Login")} replace />;
  }

  if (requirePayment && !user.hasPaid) {
    return <Navigate to={createPageUrl("Payment")} replace />;
  }

  return <>{children}</>;
}
