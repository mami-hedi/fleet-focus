import { apiClient, type ApiEnvelope } from "./api-client";

export interface SettingsDTO {
  id: number;
  companyName: string | null;
  companyLogoUrl: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyTaxId: string | null;
  notifyEmail: string | null;
  notifyOnDocumentExpiry: boolean;
  notifyOnMaintenanceDue: boolean;
  notifyOnIncident: boolean;
  documentAlertDaysBefore: number;
}

export type SettingsInput = Partial<Omit<SettingsDTO, "id">>;

export const settingsService = {
  get: async (): Promise<SettingsDTO> => {
    const res = await apiClient.get<ApiEnvelope<SettingsDTO>>("/settings");
    return res.data;
  },
  update: async (input: SettingsInput): Promise<SettingsDTO> => {
    const res = await apiClient.patch<ApiEnvelope<SettingsDTO>>("/settings", input);
    return res.data;
  },
};