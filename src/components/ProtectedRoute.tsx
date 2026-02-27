import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";
import { PageLoadingState } from "@/components/ui/LoadingStates";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePayment?: boolean;
  allowedEmails?: string[];
}

export default function ProtectedRoute({ children, requirePayment = true, allowedEmails }: ProtectedRouteProps) {
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

  if (allowedEmails && allowedEmails.length > 0) {
    const normalized = (user.email ?? "").toLowerCase().trim();
    const isAllowed = allowedEmails.map((email) => email.toLowerCase()).includes(normalized);
    if (!isAllowed) {
      return <Navigate to={createPageUrl("Calculator")} replace />;
    }
  }

  return <>{children}</>;
}
