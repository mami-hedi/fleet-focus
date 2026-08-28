import { apiClient, type ApiEnvelope } from "./api-client";

export type ActivityKind =
  | "vehicle_created"
  | "vehicle_updated"
  | "vehicle_deleted"
  | "maintenance_scheduled"
  | "inspection_created"
  | "document_created"
  | "driver_created"
  | "driver_updated"
  | "incident_created"
  | "fuel_added"
  | "reservation_created"
  | "reservation_updated";

export interface ActivityVehicleRef {
  id: string;
  brand: string;
  model: string;
  plate: string;
}

export interface ActivityUserRef {
  id: string;
  name: string;
}

export interface ActivityDTO {
  id: string;
  vehicleId: string | null;
  timestamp: string;
  kind: ActivityKind;
  label: string;
  details: string | null;
  userId: string | null;
  Vehicle: ActivityVehicleRef | null;
  User: ActivityUserRef | null;
}

export interface ActivityListParams {
  vehicleId?: string;
  kind?: ActivityKind;
  /** Le filtrage se fait côté client, mais on augmente la limite backend
   * (défaut 20, voir activity.controller.js) pour avoir assez d'historique
   * à filtrer/paginer localement. */
  limit?: number;
}

function buildQuery(params?: ActivityListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.vehicleId) qs.set("vehicleId", params.vehicleId);
  if (params.kind) qs.set("kind", params.kind);
  if (params.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const activityService = {
  list: async (params?: ActivityListParams): Promise<ActivityDTO[]> => {
    const res = await apiClient.get<ApiEnvelope<ActivityDTO[]>>(`/activity${buildQuery(params)}`);
    return res.data;
  },
};