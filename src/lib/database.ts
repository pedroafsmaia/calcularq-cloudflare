// Banco de dados local — apenas sessão e orçamentos
// Autenticação e senhas são gerenciadas exclusivamente pelo backend

export interface User {
  id: string;
  email: string;
  name: string;
  hasPaid: boolean;
  paymentDate?: string;
  stripeCustomerId?: string;
  createdAt: string;
}

// Orçamentos são gerenciados exclusivamente pelo backend (Cloudflare D1)
// via src/lib/api.ts — não há armazenamento local de orçamentos.

class LocalDatabase {
  private currentUserKey = 'calcularq_current_user';

  // Sessão do usuário
  getCurrentUser(): User | null {
    const data = localStorage.getItem(this.currentUserKey);
    return data ? JSON.parse(data) : null;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem(this.currentUserKey);
  }

  // Atualizar dados do usuário na sessão local (após pagamento, etc.)
  updateUserPayment(userId: string, hasPaid: boolean, stripeCustomerId?: string): void {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.hasPaid = hasPaid;
      if (hasPaid) currentUser.paymentDate = new Date().toISOString();
      if (stripeCustomerId) currentUser.stripeCustomerId = stripeCustomerId;
      this.setCurrentUser(currentUser);
    }
  }
}

export const db = new LocalDatabase();
