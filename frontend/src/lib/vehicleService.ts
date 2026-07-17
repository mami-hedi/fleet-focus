import { apiClient, type ApiEnvelope } from "./api-client";
import type { Vehicle } from "./mock-data";

// Forme brute renvoyée par Sequelize : id numérique, timestamps, etc.
type ApiVehicle = Omit<Vehicle, "id" | "photos"> & {
  id: number;
  photos: string[] | null;
  createdAt?: string;
  updatedAt?: string;
};

// Le reste de l'app (routes, store, mock data) manipule des id de type string
// ("v1", "v2"...). On normalise donc l'id numérique de la BD en string ici,
// une seule fois, pour ne pas propager cette incohérence partout.
function normalize(v: ApiVehicle): Vehicle {
  return { ...v, id: String(v.id), photos: v.photos ?? [] };
}

export interface VehicleListParams {
  status?: string;
  fuel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const vehicleService = {
  async list(params: VehicleListParams = {}): Promise<Vehicle[]> {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== "" && v !== "all") acc[k] = String(v);
        return acc;
      }, {}),
    ).toString();
    const res = await apiClient.get<ApiEnvelope<ApiVehicle[]>>(`/vehicles${qs ? `?${qs}` : ""}`);
    return res.data.map(normalize);
  },

  async getOne(id: string): Promise<Vehicle> {
    const res = await apiClient.get<ApiEnvelope<ApiVehicle>>(`/vehicles/${id}`);
    return normalize(res.data);
  },

  async create(payload: Omit<Vehicle, "id">): Promise<Vehicle> {
    const res = await apiClient.post<ApiEnvelope<ApiVehicle>>("/vehicles", payload);
    return normalize(res.data);
  },

  async update(id: string, payload: Partial<Omit<Vehicle, "id">>): Promise<Vehicle> {
    const res = await apiClient.patch<ApiEnvelope<ApiVehicle>>(`/vehicles/${id}`, payload);
    return normalize(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/vehicles/${id}`);
  },
};