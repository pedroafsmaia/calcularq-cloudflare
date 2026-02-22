// API client para comunicação com o backend

// Em produção (Railway), se VITE_API_URL não estiver configurado,
// usar a URL atual (mesmo domínio) já que frontend e backend estão juntos
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Se estiver em produção (não localhost), usar URL relativa
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return ''; // URL relativa (mesmo domínio)
  }
  
  // Desenvolvimento local
  return ''; // Em Cloudflare Pages/Functions, use mesma origem

};

const API_BASE_URL = getApiBaseUrl();

export interface Budget {
  id: string;
  userId: string;
  name: string;
  clientName?: string;
  projectName?: string;
  data: {
    minHourlyRate: number;
    useManualMinHourlyRate?: boolean;
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

export interface PaymentStatus {
  userId: string;
  hasPaid: boolean;
  paymentDate: string | null;
  stripeCustomerId: string | null;
}


class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  async getPaymentStatus(): Promise<PaymentStatus> {
    return this.request<PaymentStatus>(`/api/user/payment-status`);
  }

    async createCheckoutSession(): Promise<{ sessionId: string; url: string }> {
    return this.request('/api/stripe/create-checkout-session', {
      method: 'POST'
    });
  }

  async login(email: string, password: string): Promise<{ success: boolean; user: { id: string; email: string; name: string; hasPaid: boolean; paymentDate: string | null; stripeCustomerId: string | null } }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string): Promise<{ success: boolean; user: { id: string; email: string; name: string; hasPaid: boolean; paymentDate: string | null } }> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }


  async me(): Promise<{ success: boolean; user: { id: string; email: string; name: string; hasPaid: boolean; paymentDate: string | null; stripeCustomerId: string | null } }> {
    return this.request('/api/auth/me');
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  async listBudgets(): Promise<{ success: boolean; budgets: Budget[] }> {
    return this.request('/api/budgets');
  }

  async getBudget(id: string): Promise<{ success: boolean; budget: Budget }> {
    return this.request(`/api/budgets/${id}`);
  }

  async saveBudget(payload: { id?: string; name: string; clientName?: string; projectName?: string; data: any }): Promise<{ success: boolean; budget: Budget }> {
    return this.request('/api/budgets', { method: 'POST', body: JSON.stringify(payload) });
  }

  async deleteBudget(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/budgets/${id}`, { method: 'DELETE' });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
