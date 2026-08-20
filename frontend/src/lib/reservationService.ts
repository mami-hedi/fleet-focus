import { apiClient, type ApiEnvelope } from "./api-client";

// ─── Types bruts Sequelize ────────────────────────────────────────────────────

interface ApiDriver {
  id: number;
  firstName: string;
  lastName: string;
}

interface ApiVehicleShort {
  id: number;
  brand: string;
  model: string;
  plate: string;
  status: string;
}

interface ApiReservation {
  id: number;
  vehicleId: number;
  driverId: number | null;
  type: "transfer" | "day_trip" | "multi_day" | "airport";
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  clientName: string;
  clientPhone: string;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
  Vehicle?: ApiVehicleShort;
  Driver?: ApiDriver;
}

interface ApiAvailability {
  available: boolean;
  conflicts: ApiReservation[];
}

// ─── DTOs normalisés ──────────────────────────────────────────────────────────

export type ReservationStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type ReservationType = "transfer" | "day_trip" | "multi_day" | "airport";

export interface ReservationDTO {
  id: string;
  vehicleId: string;
  driverId: string | null;
  type: ReservationType;
  status: ReservationStatus;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  clientName: string;
  clientPhone: string;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
  Vehicle?: { id: string; brand: string; model: string; plate: string; status: string };
  Driver?: { id: string; firstName: string; lastName: string };
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: ReservationDTO[];
}

// ─── Paramètres ───────────────────────────────────────────────────────────────

export interface ReservationListParams {
  vehicleId?: string | number;
  driverId?: string | number;
  status?: ReservationStatus | "all";
  type?: ReservationType | "all";
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReservationInput {
  vehicleId: string | number;
  driverId?: string | number | null;
  type: ReservationType;
  status?: ReservationStatus;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  clientName: string;
  clientPhone: string;
  notes?: string | null;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function normalize(r: ApiReservation): ReservationDTO {
  return {
    ...r,
    id: String(r.id),
    vehicleId: String(r.vehicleId),
    driverId: r.driverId != null ? String(r.driverId) : null,
    notes: r.notes ?? null,
    Vehicle: r.Vehicle ? { ...r.Vehicle, id: String(r.Vehicle.id) } : undefined,
    Driver: r.Driver ? { ...r.Driver, id: String(r.Driver.id) } : undefined,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const reservationService = {
  async list(params: ReservationListParams = {}): Promise<ReservationDTO[]> {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== "" && v !== "all") acc[k] = String(v);
        return acc;
      }, {}),
    ).toString();
    const res = await apiClient.get<ApiEnvelope<ApiReservation[]>>(
      `/reservations${qs ? `?${qs}` : ""}`,
    );
    return res.data.map(normalize);
  },

  async getOne(id: string): Promise<ReservationDTO> {
    const res = await apiClient.get<ApiEnvelope<ApiReservation>>(`/reservations/${id}`);
    return normalize(res.data);
  },

  async create(input: ReservationInput): Promise<ReservationDTO> {
    const res = await apiClient.post<ApiEnvelope<ApiReservation>>("/reservations", input);
    return normalize(res.data);
  },

  async update(id: string, input: Partial<ReservationInput>): Promise<ReservationDTO> {
    const res = await apiClient.patch<ApiEnvelope<ApiReservation>>(`/reservations/${id}`, input);
    return normalize(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/reservations/${id}`);
  },

  async checkAvailability(params: {
    vehicleId: string | number;
    startDate: string;
    endDate: string;
    excludeId?: string;
  }): Promise<AvailabilityResult> {
    const qs = new URLSearchParams({
      vehicleId: String(params.vehicleId),
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.excludeId ? { excludeId: params.excludeId } : {}),
    }).toString();
    const res = await apiClient.get<ApiEnvelope<ApiAvailability>>(
      `/reservations/check-availability?${qs}`,
    );
    return {
      available: res.data.available,
      conflicts: res.data.conflicts.map(normalize),
    };
  },
};
