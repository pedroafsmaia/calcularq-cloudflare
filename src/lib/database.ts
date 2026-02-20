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

export interface Budget {
  id: string;
  userId: string;
  name: string;
  clientName?: string;
  projectName?: string;
  data: {
    minHourlyRate: number;
    factors: Array<{ id: string; name: string; weight: number; level: number }>;
    areaIntervals: Array<{ min: number; max: number | null; level: number }>;
    selections: Record<string, number>;
    estimatedHours: number;
    fixedExpenses?: Array<{ id: string; name: string; value: number }>;
    proLabore?: number;
    productiveHours?: number;
    commercialDiscount?: number;
    variableExpenses: Array<{ id: string; name: string; value: number }>;
    results: {
      globalComplexity: number;
      adjustedHourlyRate: number;
      projectPrice: number;
      finalSalePrice: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

class LocalDatabase {
  private budgetsKey = 'calcularq_budgets';
  private currentUserKey = 'calcularq_current_user';

  // Sessão
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

  // Orçamentos
  getBudgets(userId: string): Budget[] {
    const data = localStorage.getItem(this.budgetsKey);
    const allBudgets: Budget[] = data ? JSON.parse(data) : [];
    return allBudgets.filter(b => b.userId === userId);
  }

  saveBudget(budget: Budget): void {
    const data = localStorage.getItem(this.budgetsKey);
    const budgets: Budget[] = data ? JSON.parse(data) : [];
    const existingIndex = budgets.findIndex(b => b.id === budget.id);
    if (existingIndex >= 0) {
      budgets[existingIndex] = budget;
    } else {
      budgets.push(budget);
    }
    localStorage.setItem(this.budgetsKey, JSON.stringify(budgets));
  }

  deleteBudget(budgetId: string, userId: string): void {
    const data = localStorage.getItem(this.budgetsKey);
    const budgets: Budget[] = data ? JSON.parse(data) : [];
    const filtered = budgets.filter(b => !(b.id === budgetId && b.userId === userId));
    localStorage.setItem(this.budgetsKey, JSON.stringify(filtered));
  }

  getBudgetById(budgetId: string, userId: string): Budget | undefined {
    return this.getBudgets(userId).find(b => b.id === budgetId);
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
