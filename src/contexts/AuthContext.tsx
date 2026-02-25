import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, db } from "@/lib/database";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await api.me();
        const userData: User = {
          ...me.user,
          paymentDate: me.user.paymentDate ?? undefined,
          stripeCustomerId: me.user.stripeCustomerId ?? undefined,
          createdAt: me.user.createdAt ?? new Date().toISOString(),
        };
        db.setCurrentUser(userData);
        setUser(userData);
      } catch {
        db.logout();
        setUser(null);
      }

      setIsLoading(false);
    };

    void loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    const userData: User = {
      ...response.user,
      paymentDate: response.user.paymentDate ?? undefined,
      stripeCustomerId: response.user.stripeCustomerId ?? undefined,
      createdAt: response.user.createdAt ?? new Date().toISOString(),
    };
    db.setCurrentUser(userData);
    setUser(userData);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await api.register(email, password, name);
    const userData: User = {
      ...response.user,
      paymentDate: response.user.paymentDate ?? undefined,
      stripeCustomerId: response.user.stripeCustomerId ?? undefined,
      createdAt: response.user.createdAt ?? new Date().toISOString(),
    };
    db.setCurrentUser(userData);
    setUser(userData);
  };

  const logout = () => {
    api.logout().catch(() => {});
    db.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const sessionUser = db.getCurrentUser();
    if (!sessionUser) return;

    try {
      const paymentStatus = await api.getPaymentStatus();
      db.updateUserPayment(sessionUser.id, paymentStatus.hasPaid, paymentStatus.stripeCustomerId ?? undefined);
      setUser(db.getCurrentUser());
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      setUser(sessionUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
