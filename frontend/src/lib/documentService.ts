import { apiClient, type ApiEnvelope } from "./api-client";

export type DocumentType =
  | "carte_grise"
  | "assurance"
  | "controle_technique"
  | "Contrat de location"
  | "Constat assurance";

// Forme brute renvoyée par Sequelize : vehicleId numérique (FK), comme pour Vehicle.id.
interface ApiDocument {
  id: number;
  vehicleId: number;
  type: DocumentType;
  number: string;
  expiryDate: string; // DATEONLY -> "YYYY-MM-DD"
  fileUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
  Vehicle?: { id: number; brand: string; model: string; plate: string };
}

// Le store et les composants (vehicles.find(v => v.id === doc.vehicleId)) manipulent
// des Vehicle.id normalisés en string (voir vehicleService.normalize). On applique
// donc la même normalisation ici pour que la comparaison fonctionne.
export interface DocumentDTO extends Omit<ApiDocument, "vehicleId" | "Vehicle"> {
  vehicleId: string;
  Vehicle?: { id: string; brand: string; model: string; plate: string };
}

function normalize(d: ApiDocument): DocumentDTO {
  return {
    ...d,
    vehicleId: String(d.vehicleId),
    Vehicle: d.Vehicle ? { ...d.Vehicle, id: String(d.Vehicle.id) } : undefined,
  };
}

export interface DocumentInput {
  vehicleId: string | number;
  type: string;
  number: string;
  expiryDate: string;
  photo?: File | null;
}

function toFormData(input: Partial<DocumentInput>): FormData {
  const fd = new FormData();
  if (input.vehicleId !== undefined) fd.append("vehicleId", String(input.vehicleId));
  if (input.type !== undefined) fd.append("type", input.type);
  if (input.number !== undefined) fd.append("number", input.number);
  if (input.expiryDate !== undefined) fd.append("expiryDate", input.expiryDate);
  if (input.photo) fd.append("photo", input.photo);
  return fd;
}

export const documentService = {
  async list(): Promise<DocumentDTO[]> {
    const res = await apiClient.get<ApiEnvelope<ApiDocument[]>>("/documents");
    return res.data.map(normalize);
  },

  async getOne(id: number): Promise<DocumentDTO> {
    const res = await apiClient.get<ApiEnvelope<ApiDocument>>(`/documents/${id}`);
    return normalize(res.data);
  },

  async create(input: DocumentInput): Promise<DocumentDTO> {
    const res = await apiClient.post<ApiEnvelope<ApiDocument>>("/documents", toFormData(input));
    return normalize(res.data);
  },

  async update(id: number, input: Partial<DocumentInput>): Promise<DocumentDTO> {
    const res = await apiClient.patch<ApiEnvelope<ApiDocument>>(`/documents/${id}`, toFormData(input));
    return normalize(res.data);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/documents/${id}`);
  },
};