import type { BudgetData } from "@/types/budget";

// API client para comunicação com o backend

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "";
  }

  return "";
};

const API_BASE_URL = getApiBaseUrl();

export interface Budget {
  id: string;
  userId: string;
  name: string;
  clientName?: string;
  projectName?: string;
  data: BudgetData;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatus {
  userId: string;
  hasPaid: boolean;
  paymentDate: string | null;
  stripeCustomerId: string | null;
}

type ApiUser = {
  id: string;
  email: string;
  name: string;
  hasPaid: boolean;
  paymentDate: string | null;
  stripeCustomerId?: string | null;
  createdAt?: string;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const headers = new Headers(options.headers || {});
      if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return (await response.json()) as T;
      }
      return (await response.text()) as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  async getPaymentStatus(): Promise<PaymentStatus> {
    return this.request<PaymentStatus>("/api/user/payment-status");
  }

  async createCheckoutSession(): Promise<{ sessionId?: string; url: string }> {
    return this.request("/api/stripe/create-checkout-session", {
      method: "POST",
    });
  }

  async login(email: string, password: string): Promise<{ success: boolean; user: ApiUser }> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string): Promise<{ success: boolean; user: ApiUser }> {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async me(): Promise<{ success: boolean; user: ApiUser }> {
    return this.request("/api/auth/me");
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request("/api/auth/logout", { method: "POST" });
  }

  async listBudgets(): Promise<{ success: boolean; budgets: Budget[] }> {
    return this.request("/api/budgets");
  }

  async getBudget(id: string): Promise<{ success: boolean; budget: Budget }> {
    return this.request(`/api/budgets/${id}`);
  }

  async saveBudget(payload: {
    id?: string;
    name: string;
    clientName?: string;
    projectName?: string;
    data: BudgetData;
  }): Promise<{ success: boolean; budget: Budget }> {
    return this.request("/api/budgets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async deleteBudget(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/budgets/${id}`, { method: "DELETE" });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
