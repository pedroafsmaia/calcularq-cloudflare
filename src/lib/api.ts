import type { BudgetData, BudgetScopeChange, BudgetCloseFeedback } from "@/types/budget";

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

export interface AdminSummaryData {
  totalUsers: number;
  totalPaidUsers: number;
  totalBudgets: number;
  totalFeedbacks: number;
  feedbackRate: number | null;
  closingRate: number | null;
  hoursAdherence: number | null;
  priceAdherence: number | null;
}

export interface AdminUsageData {
  tipologiaDistribution: Record<string, number>;
  areaDistribution: Record<string, number>;
  f3Distribution: Record<string, number>;
  f4Distribution: Record<string, number>;
  f5Distribution: Record<string, number>;
  volumetriaDistribution: Record<string, number>;
  reformaDistribution: { reforma: number; novaObra: number };
  monthlyEvolution: Record<string, number>;
}

export interface AdminCommercialData {
  avgSuggestedPrice: number | null;
  avgClosedPrice: number | null;
  avgDifference: number | null;
  avgDiscount: number | null;
  pricePerSqmByTipologia: Record<string, { suggested: number | null; closed: number | null }>;
  feedbackDistribution: Record<string, number>;
}

export interface AdminCalibrationData {
  hoursComparison: { suggested: number | null; actual: number | null; difference: number | null };
  differenceByTipologia: Record<string, { suggested: number | null; actual: number | null; diff: number | null }>;
  differenceByAreaRange: Record<string, { suggested: number | null; actual: number | null; diff: number | null }>;
  differenceByF3: Record<string, { suggested: number | null; actual: number | null; diff: number | null }>;
  differenceByF4: Record<string, { suggested: number | null; actual: number | null; diff: number | null }>;
  differenceByF5: Record<string, { suggested: number | null; actual: number | null; diff: number | null }>;
  differenceByReforma: Record<string, { suggested: number | null; actual: number | null; diff: number | null }>;
  mostUnderestimated: Array<{ label: string; diffPercent: number }>;
  mostOverestimated: Array<{ label: string; diffPercent: number }>;
}

export type AdminFilters = {
  period_start?: string;
  period_end?: string;
  tipologia?: string;
  area_min?: string;
  area_max?: string;
  feedback_only?: string;
  reforma?: string;
  close_status?: string;
};

type ApiUser = {
  id: string;
  email: string;
  name: string;
  hasPaid: boolean;
  paymentDate: string | null;
  stripeCustomerId?: string | null;
  isAdmin?: boolean;
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
        const contentType = response.headers.get("content-type") || "";
        let message = `Falha na requisição (${response.status})`;
        if (contentType.includes("application/json")) {
          const error = await response.json().catch(() => ({} as Record<string, unknown>));
          message =
            String((error as { message?: string }).message || (error as { error?: string }).error || message);
        } else {
          const text = await response.text().catch(() => "");
          if (response.status >= 500 && text.includes("Error 1101")) {
            message = "Serviço temporariamente indisponível. Tente novamente em instantes.";
          } else if (text.trim()) {
            message = text.slice(0, 180);
          }
        }
        throw new Error(message);
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

  async closeBudget(
    id: string,
    payload: {
      actualHoursTotal: number;
      actualHoursByPhase?: {
        briefing?: number;
        ep?: number;
        ap?: number;
        ex?: number;
        compat?: number;
        obra?: number;
      };
      scopeChange: BudgetScopeChange;
      closeFeedback?: BudgetCloseFeedback;
      closedDealValue?: number;
    }
  ): Promise<{ success: boolean; budget: Budget }> {
    return this.request(`/api/budgets/${id}/close`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  private buildAdminQuery(filters?: AdminFilters): string {
    if (!filters) return "";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  async getAdminSummary(filters?: AdminFilters): Promise<{ success: boolean; data: AdminSummaryData }> {
    return this.request(`/api/admin/summary${this.buildAdminQuery(filters)}`);
  }

  async getAdminUsage(filters?: AdminFilters): Promise<{ success: boolean; data: AdminUsageData }> {
    return this.request(`/api/admin/usage${this.buildAdminQuery(filters)}`);
  }

  async getAdminCommercial(filters?: AdminFilters): Promise<{ success: boolean; data: AdminCommercialData }> {
    return this.request(`/api/admin/commercial${this.buildAdminQuery(filters)}`);
  }

  async getAdminCalibration(filters?: AdminFilters): Promise<{ success: boolean; data: AdminCalibrationData }> {
    return this.request(`/api/admin/calibration${this.buildAdminQuery(filters)}`);
  }
}

export const api = new ApiClient(API_BASE_URL);


