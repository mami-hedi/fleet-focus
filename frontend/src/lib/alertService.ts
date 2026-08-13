import { apiClient, type ApiEnvelope } from "./api-client";

export type AlertSeverity = "high" | "medium" | "low";
export type AlertType = "document" | "maintenance";

export interface AlertVehicleRef {
  id: string;
  brand: string;
  model: string;
  plate: string;
}

export interface AlertDTO {
  id: string; // alertKey déterministe, ex: "document-14", "maintenance-7"
  type: AlertType;
  vehicleId: string;
  vehicle: AlertVehicleRef | null;
  message: string;
  severity: AlertSeverity;
  date: string;
  refId: number | string;
}

export interface AlertListParams {
  daysBefore?: number;
}

function buildQuery(params?: AlertListParams): string {
  if (!params?.daysBefore) return "";
  return `?daysBefore=${params.daysBefore}`;
}

export const alertService = {
  list: async (params?: AlertListParams): Promise<AlertDTO[]> => {
    const res = await apiClient.get<ApiEnvelope<AlertDTO[]>>(`/alerts${buildQuery(params)}`);
    return res.data;
  },

  dismiss: async (alertKey: string): Promise<void> => {
    await apiClient.post<ApiEnvelope<null>>(`/alerts/${alertKey}/dismiss`, {});
  },
};