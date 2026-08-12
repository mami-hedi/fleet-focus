import { apiClient, type ApiEnvelope } from "./api-client";

export type RecurrenceType = "none" | "monthly" | "quarterly" | "biannual" | "annual";
export type MaintenanceStatus = "upcoming" | "in_progress" | "completed";

// Forme brute renvoyée par Sequelize.
interface ApiMaintenance {
  id: number;
  vehicleId: number;
  type: string;
  scheduledDate: string;
  completedDate: string | null;
  status: MaintenanceStatus;
  // DECIMAL(10,2) : le driver MySQL renvoie généralement une string ("150.00"), pas un number.
  cost: string | number | null;
  garage: string;
  recurrence: RecurrenceType;
  seriesId: string | null;
  createdAt?: string;
  updatedAt?: string;
  Vehicle?: { id: number; brand: string; model: string; plate: string };
}

// id et vehicleId normalisés en string pour rester cohérents avec Vehicle.id
// (voir vehicleService.normalize) ; cost normalisé en number pour un usage direct en JS.
export interface MaintenanceDTO extends Omit<ApiMaintenance, "id" | "vehicleId" | "cost" | "Vehicle"> {
  id: string;
  vehicleId: string;
  cost: number | null;
  Vehicle?: { id: string; brand: string; model: string; plate: string };
}

function normalize(m: ApiMaintenance): MaintenanceDTO {
  return {
    ...m,
    id: String(m.id),
    vehicleId: String(m.vehicleId),
    cost: m.cost !== null && m.cost !== undefined ? Number(m.cost) : null,
    Vehicle: m.Vehicle ? { ...m.Vehicle, id: String(m.Vehicle.id) } : undefined,
  };
}

export interface MaintenanceListParams {
  vehicleId?: string;
  status?: string;
  seriesId?: string;
}

export interface MaintenanceInput {
  vehicleId: string | number;
  type: string;
  scheduledDate: string;
  garage: string;
  status?: MaintenanceStatus;
  completedDate?: string | null;
  cost?: number | null;
  recurrence?: RecurrenceType;
}

export const maintenanceService = {
  async list(params: MaintenanceListParams = {}): Promise<MaintenanceDTO[]> {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== "" && v !== "all") acc[k] = String(v);
        return acc;
      }, {}),
    ).toString();
    const res = await apiClient.get<ApiEnvelope<ApiMaintenance[]>>(`/maintenances${qs ? `?${qs}` : ""}`);
    return res.data.map(normalize);
  },

  async getOne(id: string): Promise<MaintenanceDTO> {
    const res = await apiClient.get<ApiEnvelope<ApiMaintenance>>(`/maintenances/${id}`);
    return normalize(res.data);
  },

  // ⚠️ Ne PAS générer les occurrences récurrentes côté frontend : le backend s'en charge
  // (voir maintenance.controller.js -> create()) et renvoie donc un TABLEAU d'occurrences
  // créées, même pour une maintenance simple (tableau à 1 élément dans ce cas).
  async create(input: MaintenanceInput): Promise<MaintenanceDTO[]> {
    const res = await apiClient.post<ApiEnvelope<ApiMaintenance[]>>("/maintenances", input);
    return res.data.map(normalize);
  },

  async update(id: string, input: Partial<MaintenanceInput>): Promise<MaintenanceDTO> {
    const res = await apiClient.patch<ApiEnvelope<ApiMaintenance>>(`/maintenances/${id}`, input);
    return normalize(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/maintenances/${id}`);
  },
};