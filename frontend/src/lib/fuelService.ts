import { apiClient, type ApiEnvelope } from "./api-client";

// ─── Types bruts renvoyés par Sequelize ─────────────────────────────────────

interface ApiFuelEntry {
  id: number;
  vehicleId: number;
  date: string;
  station: string;
  /** DECIMAL(8,2) → souvent string côté driver MySQL */
  liters: string | number;
  /** DECIMAL(8,3) → souvent string côté driver MySQL */
  pricePerLiter: string | number;
  /** DECIMAL(10,2) → souvent string côté driver MySQL */
  totalCost: string | number;
  mileage: number;
  fullTank: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Inclus via l'option include du controller */
  Vehicle?: { id: number; brand: string; model: string; plate: string };
}

interface ApiFuelStats {
  totalLiters: string | number;
  totalCost: string | number;
  avgPricePerLiter: string | number;
  count: number;
  byVehicle: Array<{
    vehicleId: number;
    brand: string;
    model: string;
    plate: string;
    totalLiters: string | number;
    totalCost: string | number;
    /** L/100 km — null si données insuffisantes */
    avgConsumption: string | number | null;
  }>;
}

// ─── DTOs normalisés (id et vehicleId → string, décimaux → number) ──────────

export interface FuelEntryDTO {
  id: string;
  vehicleId: string;
  date: string;
  station: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  fullTank: boolean;
  createdAt?: string;
  updatedAt?: string;
  Vehicle?: { id: string; brand: string; model: string; plate: string };
}

export interface FuelStatsDTO {
  totalLiters: number;
  totalCost: number;
  avgPricePerLiter: number;
  count: number;
  byVehicle: Array<{
    vehicleId: string;
    brand: string;
    model: string;
    plate: string;
    totalLiters: number;
    totalCost: number;
    avgConsumption: number | null;
  }>;
}

// ─── Paramètres de listing ────────────────────────────────────────────────────

export interface FuelListParams {
  vehicleId?: string | number;
  fullTank?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Input de création / modification ────────────────────────────────────────

export interface FuelInput {
  vehicleId: string | number;
  date: string;
  station: string;
  liters: number;
  pricePerLiter: number;
  mileage: number;
  fullTank?: boolean;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function normalize(e: ApiFuelEntry): FuelEntryDTO {
  return {
    ...e,
    id: String(e.id),
    vehicleId: String(e.vehicleId),
    liters: Number(e.liters),
    pricePerLiter: Number(e.pricePerLiter),
    totalCost: Number(e.totalCost),
    Vehicle: e.Vehicle
      ? { ...e.Vehicle, id: String(e.Vehicle.id) }
      : undefined,
  };
}

function normalizeStats(s: ApiFuelStats): FuelStatsDTO {
  return {
    totalLiters: Number(s.totalLiters),
    totalCost: Number(s.totalCost),
    avgPricePerLiter: Number(s.avgPricePerLiter),
    count: s.count,
    byVehicle: s.byVehicle.map((v) => ({
      vehicleId: String(v.vehicleId),
      brand: v.brand,
      model: v.model,
      plate: v.plate,
      totalLiters: Number(v.totalLiters),
      totalCost: Number(v.totalCost),
      avgConsumption: v.avgConsumption !== null ? Number(v.avgConsumption) : null,
    })),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const fuelService = {
  async list(params: FuelListParams = {}): Promise<FuelEntryDTO[]> {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== "" && v !== "all") acc[k] = String(v);
        return acc;
      }, {}),
    ).toString();
    const res = await apiClient.get<ApiEnvelope<ApiFuelEntry[]>>(
      `/fuel${qs ? `?${qs}` : ""}`,
    );
    return res.data.map(normalize);
  },

  async getOne(id: string): Promise<FuelEntryDTO> {
    const res = await apiClient.get<ApiEnvelope<ApiFuelEntry>>(`/fuel/${id}`);
    return normalize(res.data);
  },

  async create(input: FuelInput): Promise<FuelEntryDTO> {
    const res = await apiClient.post<ApiEnvelope<ApiFuelEntry>>("/fuel", input);
    return normalize(res.data);
  },

  async update(id: string, input: Partial<FuelInput>): Promise<FuelEntryDTO> {
    const res = await apiClient.patch<ApiEnvelope<ApiFuelEntry>>(
      `/fuel/${id}`,
      input,
    );
    return normalize(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/fuel/${id}`);
  },

  async getStats(): Promise<FuelStatsDTO> {
    const res = await apiClient.get<ApiEnvelope<ApiFuelStats>>("/fuel/stats");
    return normalizeStats(res.data);
  },
};
