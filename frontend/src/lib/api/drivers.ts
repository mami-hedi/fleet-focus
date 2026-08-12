import { apiClient, type ApiEnvelope } from "./client";

export type DriverStatus = "active" | "inactive";

// Forme brute renvoyée par Sequelize.
interface ApiDriver {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string; // DATEONLY -> "YYYY-MM-DD"
  assignedVehicleId: number | null;
  photo: string | null; // chemin relatif "/uploads/drivers/xxx.jpg", jamais du base64
  status: DriverStatus;
  createdAt?: string;
  updatedAt?: string;
  assignedVehicle?: { id: number; brand: string; model: string; plate: string };
}

// id/assignedVehicleId normalisés en string pour rester cohérents avec Vehicle.id
// utilisé partout ailleurs dans l'app (voir vehicleService.normalize).
export interface Driver extends Omit<ApiDriver, "id" | "assignedVehicleId" | "assignedVehicle"> {
  id: number; // conservé en number ici : drivers.tsx utilise déjà des id numériques (mutateAsync(id))
  assignedVehicleId: string | null;
  assignedVehicle?: { id: string; brand: string; model: string; plate: string };
}

function normalize(d: ApiDriver): Driver {
  return {
    ...d,
    assignedVehicleId: d.assignedVehicleId !== null ? String(d.assignedVehicleId) : null,
    assignedVehicle: d.assignedVehicle ? { ...d.assignedVehicle, id: String(d.assignedVehicle.id) } : undefined,
  };
}

// ⚠️ "photo" est un File (upload réel), jamais une string base64 — la colonne
// backend est un STRING court (chemin), pas un champ prévu pour stocker un blob.
export interface DriverInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: DriverStatus;
  assignedVehicleId?: string | number | null;
  photo?: File | null;
}

export interface DriverListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
}

export interface DriverListResult {
  items: Driver[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function toFormData(input: Partial<DriverInput>): FormData {
  const fd = new FormData();
  if (input.firstName !== undefined) fd.append("firstName", input.firstName);
  if (input.lastName !== undefined) fd.append("lastName", input.lastName);
  if (input.email !== undefined) fd.append("email", input.email);
  if (input.phone !== undefined) fd.append("phone", input.phone);
  if (input.licenseNumber !== undefined) fd.append("licenseNumber", input.licenseNumber);
  if (input.licenseExpiry !== undefined) fd.append("licenseExpiry", input.licenseExpiry);
  if (input.status !== undefined) fd.append("status", input.status);
  if (input.assignedVehicleId !== undefined && input.assignedVehicleId !== null) {
    fd.append("assignedVehicleId", String(input.assignedVehicleId));
  }
  if (input.photo) fd.append("photo", input.photo);
  return fd;
}

export const driversApi = {
  async list(params: DriverListParams = {}): Promise<DriverListResult> {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== "") acc[k] = String(v);
        return acc;
      }, {}),
    ).toString();
    const res = await apiClient.get<ApiEnvelope<ApiDriver[]>>(`/drivers${qs ? `?${qs}` : ""}`);
    return {
      items: res.data.map(normalize),
      page: res.meta?.page ?? 1,
      limit: res.meta?.limit ?? res.data.length,
      total: res.meta?.total ?? res.data.length,
      totalPages: res.meta?.totalPages ?? 1,
    };
  },

  async getOne(id: number): Promise<Driver> {
    const res = await apiClient.get<ApiEnvelope<ApiDriver>>(`/drivers/${id}`);
    return normalize(res.data);
  },

  async create(input: DriverInput): Promise<Driver> {
    const res = await apiClient.post<ApiEnvelope<ApiDriver>>("/drivers", toFormData(input));
    return normalize(res.data);
  },

  async update(id: number, input: Partial<DriverInput>): Promise<Driver> {
    const res = await apiClient.patch<ApiEnvelope<ApiDriver>>(`/drivers/${id}`, toFormData(input));
    return normalize(res.data);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/drivers/${id}`);
  },
};