import { apiClient, type ApiEnvelope } from "./api-client";

// ─── Types bruts Sequelize ────────────────────────────────────────────────────

interface ApiPayment {
  id: number;
  reservationId: number;
  /** DECIMAL(10,2) → souvent string côté driver MySQL */
  amount: string | number;
  method: "cash" | "card" | "transfer" | "cheque";
  status: "pending" | "paid" | "partial" | "refunded";
  paidAt: string | null;
  reference: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
  Reservation?: {
    id: number;
    clientName: string;
    clientPhone: string;
    startDate: string;
    endDate: string;
    type: string;
    status: string;
    Vehicle?: { id: number; brand: string; model: string; plate: string };
  };
}

interface ApiPaymentStats {
  totalPaid: string | number;
  totalPending: string | number;
  totalRefunded: string | number;
  totalPartial: string | number;
  recoveryRate: number;
  monthRevenue: string | number;
  byMethod: { cash: number; card: number; transfer: number; cheque: number };
}

// ─── DTOs normalisés ──────────────────────────────────────────────────────────

export type PaymentMethod = "cash" | "card" | "transfer" | "cheque";
export type PaymentStatus = "pending" | "paid" | "partial" | "refunded";

export interface PaymentDTO {
  id: string;
  reservationId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  reference: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
  Reservation?: {
    id: string;
    clientName: string;
    clientPhone: string;
    startDate: string;
    endDate: string;
    type: string;
    status: string;
    Vehicle?: { id: string; brand: string; model: string; plate: string };
  };
}

export interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  totalPartial: number;
  recoveryRate: number;
  monthRevenue: number;
  byMethod: { cash: number; card: number; transfer: number; cheque: number };
}

// ─── Paramètres ───────────────────────────────────────────────────────────────

export interface PaymentListParams {
  reservationId?: string | number;
  status?: PaymentStatus | "all";
  method?: PaymentMethod | "all";
  page?: number;
  limit?: number;
}

export interface PaymentInput {
  reservationId: string | number;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  paidAt?: string | null;
  reference?: string | null;
  notes?: string | null;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function normalize(p: ApiPayment): PaymentDTO {
  return {
    ...p,
    id: String(p.id),
    reservationId: String(p.reservationId),
    amount: Number(p.amount),
    paidAt: p.paidAt ?? null,
    reference: p.reference ?? null,
    notes: p.notes ?? null,
    Reservation: p.Reservation
      ? {
          ...p.Reservation,
          id: String(p.Reservation.id),
          Vehicle: p.Reservation.Vehicle
            ? { ...p.Reservation.Vehicle, id: String(p.Reservation.Vehicle.id) }
            : undefined,
        }
      : undefined,
  };
}

function normalizeStats(s: ApiPaymentStats): PaymentStats {
  return {
    totalPaid: Number(s.totalPaid),
    totalPending: Number(s.totalPending),
    totalRefunded: Number(s.totalRefunded),
    totalPartial: Number(s.totalPartial),
    recoveryRate: s.recoveryRate,
    monthRevenue: Number(s.monthRevenue),
    byMethod: s.byMethod,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const paymentService = {
  async list(params: PaymentListParams = {}): Promise<PaymentDTO[]> {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== "" && v !== "all") acc[k] = String(v);
        return acc;
      }, {}),
    ).toString();
    const res = await apiClient.get<ApiEnvelope<ApiPayment[]>>(
      `/payments${qs ? `?${qs}` : ""}`,
    );
    return res.data.map(normalize);
  },

  async getOne(id: string): Promise<PaymentDTO> {
    const res = await apiClient.get<ApiEnvelope<ApiPayment>>(`/payments/${id}`);
    return normalize(res.data);
  },

  async create(input: PaymentInput): Promise<PaymentDTO> {
    const res = await apiClient.post<ApiEnvelope<ApiPayment>>("/payments", input);
    return normalize(res.data);
  },

  async update(id: string, input: Partial<PaymentInput>): Promise<PaymentDTO> {
    const res = await apiClient.patch<ApiEnvelope<ApiPayment>>(`/payments/${id}`, input);
    return normalize(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/payments/${id}`);
  },

  async getStats(): Promise<PaymentStats> {
    const res = await apiClient.get<ApiEnvelope<ApiPaymentStats>>("/payments/stats");
    return normalizeStats(res.data);
  },
};
