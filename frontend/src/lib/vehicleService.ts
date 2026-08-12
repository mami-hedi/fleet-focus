import { apiClient, type ApiEnvelope } from "./api-client";
import type { Vehicle } from "./mock-data";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const FILE_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// Forme brute renvoyée par Sequelize : id numérique, image/photos en chemins courts
// ou URLs externes (jamais de base64 depuis le fix upload).
type ApiVehicle = Omit<Vehicle, "id" | "photos"> & {
  id: number;
  photos: string[] | null;
  createdAt?: string;
  updatedAt?: string;
};

// Résout un chemin/URL de fichier en une URL affichable, en filtrant les valeurs
// legacy corrompues (base64 stocké avant le fix upload, souvent trop long pour être
// chargé par le navigateur en tant qu'URL). Centralisé ici : les pages/composants qui
// consomment Vehicle.image / Vehicle.photos reçoivent directement une URL utilisable
// (ou null), sans avoir à connaître FILE_ORIGIN ni le format de stockage.
function resolveUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("data:")) return null; // legacy corrompu : on laisse VehicleImage afficher son repli
  return `${FILE_ORIGIN}${u}`;
}

// Défensif : selon la version de Sequelize/mysql2, une colonne JSON peut revenir soit
// déjà parsée en tableau, soit encore sous forme de string JSON brute ("[\"a\",\"b\"]").
// On gère les deux cas plutôt que de supposer un format fixe.
function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalize(v: ApiVehicle): Vehicle {
  return {
    ...v,
    id: String(v.id),
    image: resolveUrl(v.image) as Vehicle["image"],
    photos: toArray(v.photos).map(resolveUrl).filter((x): x is string => !!x),
  };
}

export interface VehicleListParams {
  status?: string;
  fuel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Champs texte communs à la création et la modification.
interface VehicleScalarFields {
  brand: string;
  model: string;
  year: number;
  plate: string;
  vin: string;
  color?: string;
  transmission?: Vehicle["transmission"];
  fuel: Vehicle["fuel"];
  mileage?: number;
  status?: Vehicle["status"];
}

// ⚠️ Plus de "image: string base64" ni "photos: string[] base64" : la photo de
// couverture et les photos additionnelles sont de vrais fichiers (upload multipart).
export interface VehicleInput extends Partial<VehicleScalarFields> {
  // Nouveau fichier de couverture à uploader (prioritaire sur imageUrl si présent).
  coverFile?: File | null;
  // URL externe collée manuellement, ou chemin existant à conserver tel quel.
  imageUrl?: string;
  // Nouveaux fichiers à ajouter à la galerie.
  newPhotos?: File[];
  // Chemins/URLs de photos existantes à conserver (les absentes de cette liste
  // seront supprimées côté serveur). Omettre ce champ = ne pas toucher aux photos.
  keepPhotos?: string[];
}

function toFormData(input: VehicleInput): FormData {
  const fd = new FormData();
  const scalarKeys: (keyof VehicleScalarFields)[] = [
    "brand", "model", "year", "plate", "vin", "color", "transmission", "fuel", "mileage", "status",
  ];
  for (const key of scalarKeys) {
    const value = input[key];
    if (value !== undefined && value !== null) fd.append(key, String(value));
  }

  if (input.coverFile) {
    fd.append("image", input.coverFile);
  } else if (input.imageUrl !== undefined) {
    fd.append("image", input.imageUrl);
  }

  if (input.newPhotos?.length) {
    input.newPhotos.forEach((file) => fd.append("photos", file));
  }
  if (input.keepPhotos !== undefined) {
    fd.append("keepPhotos", JSON.stringify(input.keepPhotos));
  }

  return fd;
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

  async create(input: VehicleInput): Promise<Vehicle> {
    const res = await apiClient.post<ApiEnvelope<ApiVehicle>>("/vehicles", toFormData(input));
    return normalize(res.data);
  },

  async update(id: string, input: VehicleInput): Promise<Vehicle> {
    const res = await apiClient.patch<ApiEnvelope<ApiVehicle>>(`/vehicles/${id}`, toFormData(input));
    return normalize(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`/vehicles/${id}`);
  },
};