import { apiClient, type ApiEnvelope } from "./api-client";
export type IncidentSeverity = "minor" | "moderate" | "severe";
export type IncidentStatus = "open" | "in_progress" | "resolved";
// Forme "app" (utilisée par les composants React) : ids en string, comme
// pour Vehicle, pour rester cohérent avec le reste du store.
export interface Incident {
  id: string;
  vehicleId: string;
  driverId?: string;
  date: string;
  location: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  photos: string[];
  cost?: number;
  insuranceClaim: boolean;
  createdAt: string;
}
// Forme brute renvoyée par Sequelize (id numérique, relations incluses,
// timestamps...).
interface ApiIncident {
  id: number;
  vehicleId: number;
  driverId: number | null;
  date: string;
  location: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  // En théorie un vrai tableau grâce à DataTypes.JSON côté Sequelize, mais on
  // reste défensif : certains enregistrements plus anciens ou certains
  // drivers SQL peuvent renvoyer une chaîne JSON brute (ex: "[]") au lieu
  // d'un tableau déjà parsé.
  photos: string[] | string | null;
  cost: string | number | null; // DECIMAL Sequelize revient souvent en string
  insuranceClaim: boolean;
  createdAt?: string;
  updatedAt?: string;
  Vehicle?: unknown;
  Driver?: unknown;
}

// Normalise le champ photos quel que soit le format brut reçu de l'API :
// - déjà un tableau -> tel quel
// - chaîne JSON ("[]", "[\"url\"]"...) -> on la parse
// - null / undefined / valeur invalide -> tableau vide
function normalizePhotos(photos: string[] | string | null | undefined): string[] {
  if (Array.isArray(photos)) return photos;
  if (typeof photos === "string" && photos.trim() !== "") {
    try {
      const parsed = JSON.parse(photos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalize(i: ApiIncident): Incident {
  return {
    id: String(i.id),
    vehicleId: String(i.vehicleId),
    driverId: i.driverId != null ? String(i.driverId) : undefined,
    date: i.date,
    location: i.location,
    description: i.description,
    severity: i.severity,
    status: i.status,
    photos: normalizePhotos(i.photos),
    cost: i.cost != null ? Number(i.cost) : undefined,
    insuranceClaim: !!i.insuranceClaim,
    createdAt: i.createdAt ?? new Date().toISOString(),
  };
}
export interface IncidentListParams {
  vehicleId?: string;
  driverId?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  search?: string;
  page?: number;
  limit?: number;
}
export type IncidentPayload = Omit<Incident, "id" | "createdAt">;
export const incidentService = {
  async list(params: IncidentListParams = {}): Promise<Incident[]> {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== "" && v !== "all") acc[k] = String(v);
        return acc;
      }, {}),
    ).toString();
    const res = await apiClient.get<ApiEnvelope<ApiIncident[]>>(`/incidents${qs ? `?${qs}` : ""}`);
    return res.data.map(normalize);
  },
  async getOne(id: string): Promise<Incident> {
    const res = await apiClient.get<ApiEnvelope<ApiIncident>>(`/incidents/${id}`);
    return normalize(res.data);
  },
  async create(payload: IncidentPayload): Promise<Incident> {
    const res = await apiClient.post<ApiEnvelope<ApiIncident>>("/incidents", payload);
    return normalize(res.data);
  },
  async update(id: string, payload: Partial<IncidentPayload>): Promise<Incident> {
    const res = await apiClient.patch<ApiEnvelope<ApiIncident>>(`/incidents/${id}`, payload);
    return normalize(res.data);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/incidents/${id}`);
  },
};