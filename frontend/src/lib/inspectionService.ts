import { apiClient, type ApiEnvelope } from "./api-client";

// ─── Types bruts Sequelize ────────────────────────────────────────────────────

interface ApiInspection {
  id: number;
  vehicleId: number;
  type: "entree" | "sortie";
  date: string;
  mileage: number;
  fuelLevel: number;
  notes: string | null;
  checklist: InspectionChecklist;
  photos: string[] | null;
  createdAt?: string;
  updatedAt?: string;
  Vehicle?: { id: number; brand: string; model: string; plate: string; mileage: number };
}

// ─── DTOs normalisés ──────────────────────────────────────────────────────────

export type InspectionType = "entree" | "sortie";

export interface InspectionChecklist {
  tires: boolean;
  exteriorClean: boolean;
  interiorClean: boolean;
  spareWheel: boolean;
  triangle: boolean;
  vest: boolean;
}

export interface InspectionDTO {
  id: string;
  vehicleId: string;
  type: InspectionType;
  date: string;
  mileage: number;
  fuelLevel: number;
  notes: string | null;
  checklist: InspectionChecklist;
  photos: string[];
  createdAt?: string;
  updatedAt?: string;
  Vehicle?: { id: string; brand: string; model: string; plate: string; mileage: number };
}

// ─── Paramètres ───────────────────────────────────────────────────────────────

export interface InspectionListParams {
  vehicleId?: string | number;
  type?: InspectionType | "all";
}

export interface InspectionInput {
  vehicleId: string | number;
  type: InspectionType;
  date: string;
  mileage: number;
  fuelLevel: number;
  notes?: string | null;
  checklist: InspectionChecklist;
  /** Nouveaux fichiers à uploader (6 max, un par zone). Vide en édition = photos existantes conservées. */
  photos?: File[];
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function normalize(i: ApiInspection): InspectionDTO {
  return {
    ...i,
    id: String(i.id),
    vehicleId: String(i.vehicleId),
    notes: i.notes ?? null,
    photos: i.photos ?? [],
    Vehicle: i.Vehicle
      ? { ...i.Vehicle, id: String(i.Vehicle.id) }
      : undefined,
  };
}

function buildFormData(input: InspectionInput): FormData {
  const fd = new FormData();
  fd.append("vehicleId", String(input.vehicleId));
  fd.append("type", input.type);
  fd.append("date", input.date);
  fd.append("mileage", String(input.mileage));
  fd.append("fuelLevel", String(input.fuelLevel));
  if (input.notes) fd.append("notes", input.notes);
  fd.append("checklist", JSON.stringify(input.checklist));
  (input.photos ?? []).forEach((file) => fd.append("photos", file));
  return fd;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const inspectionService = {
  async list(params: InspectionListParams = {}): Promise<InspectionDTO[]> {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== "" && v !== "all") acc[k] = String(v);
        return acc;
      }, {}),
    ).toString();
    const res = await apiClient.get<ApiEnvelope<ApiInspection[]>>(
      `/inspections${qs ? `?${qs}` : ""}`,
    );
    return res.data.map(normalize);
  },

  async getOne(id: string): Promise<InspectionDTO> {
    const res = await apiClient.get<ApiEnvelope<ApiInspection>>(`/inspections/${id}`);
    return normalize(res.data);
  },

  async create(input: InspectionInput): Promise<InspectionDTO> {
    const res = await apiClient.post<ApiEnvelope<ApiInspection>>("/inspections", buildFormData(input));
    return normalize(res.data);
  },

  async update(id: string, input: Partial<InspectionInput>): Promise<InspectionDTO> {
    const res = await apiClient.patch<ApiEnvelope<ApiInspection>>(
      `/inspections/${id}`,
      buildFormData(input as InspectionInput),
    );
    return normalize(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/inspections/${id}`);
  },
};