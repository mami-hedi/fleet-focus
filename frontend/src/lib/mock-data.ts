export type VehicleStatus = "available" | "rented" | "maintenance" | "out_of_service";
export type FuelType = "essence" | "diesel" | "hybride" | "electrique";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  vin: string;
  color: string;
  transmission: "manuelle" | "automatique";
  fuel: FuelType;
  mileage: number;
  status: VehicleStatus;
  image: string;
  photos?: string[];
}

export type Recurrence = "none" | "monthly" | "quarterly" | "biannual" | "annual";

export const recurrenceLabels: Record<Recurrence, string> = {
  none: "Aucune",
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
  biannual: "Semestrielle",
  annual: "Annuelle",
};

export const recurrenceMonths: Record<Recurrence, number> = {
  none: 0, monthly: 1, quarterly: 3, biannual: 6, annual: 12,
};

export interface HistoryEntry {
  id: string;
  vehicleId: string;
  timestamp: string;
  kind:
    | "vehicle_created"
    | "vehicle_updated"
    | "vehicle_deleted"
    | "maintenance_scheduled"
    | "inspection_created";
  label: string;
  details?: string;
}

export interface Alert {
  id: string;
  vehicleId: string;
  message: string;
  severity: "high" | "medium" | "low";
  date: string;
}

export interface Inspection {
  id: string;
  vehicleId: string;
  type: "entree" | "sortie";
  date: string;
  mileage: number;
  fuelLevel: number;
  notes: string;
  checklist: {
    tires: boolean;
    exteriorClean: boolean;
    interiorClean: boolean;
    spareWheel: boolean;
    triangle: boolean;
    vest: boolean;
  };
  photos: string[];
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  type: string;
  scheduledDate: string;
  completedDate?: string;
  status: "upcoming" | "in_progress" | "completed";
  cost?: number;
  garage: string;
  recurrence?: Recurrence;
  seriesId?: string;
}

export interface DocumentItem {
  id: string;
  vehicleId: string;
  type: "carte_grise" | "assurance" | "controle_technique" | "Contrat de location" | "Constat assurance";
  number: string;
  expiryDate: string;
}

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=800&q=70`;

export const vehicles: Vehicle[] = [
  { id: "v1", brand: "Dacia", model: "Sandero", year: 2022, plate: "AB-123-CD", vin: "VF1XXX000001", color: "Blanc", transmission: "manuelle", fuel: "essence", mileage: 45230, status: "available", image: img("1552519507-da3b142c6e3d") },
  { id: "v2", brand: "Renault", model: "Clio V", year: 2023, plate: "EF-456-GH", vin: "VF1XXX000002", color: "Gris", transmission: "manuelle", fuel: "diesel", mileage: 28100, status: "rented", image: img("1580273916550-e323be2ae537") },
  { id: "v3", brand: "Peugeot", model: "208", year: 2023, plate: "IJ-789-KL", vin: "VF3XXX000003", color: "Bleu", transmission: "automatique", fuel: "essence", mileage: 18420, status: "available", image: img("1494976388531-d1058494cdd8") },
  { id: "v4", brand: "Toyota", model: "Yaris Hybrid", year: 2024, plate: "MN-012-OP", vin: "JTDXXX000004", color: "Rouge", transmission: "automatique", fuel: "hybride", mileage: 8900, status: "rented", image: img("1621007947382-bb3c3994e3fb") },
  { id: "v5", brand: "Hyundai", model: "i20", year: 2022, plate: "QR-345-ST", vin: "TMAXXX000005", color: "Noir", transmission: "manuelle", fuel: "essence", mileage: 52300, status: "maintenance", image: img("1606664515524-ed2f786a0bd6") },
  { id: "v6", brand: "Renault", model: "Captur", year: 2023, plate: "UV-678-WX", vin: "VF1XXX000006", color: "Orange", transmission: "automatique", fuel: "diesel", mileage: 31200, status: "available", image: img("1503376780353-7e6692767b70") },
  { id: "v7", brand: "Peugeot", model: "3008", year: 2022, plate: "YZ-901-AB", vin: "VF3XXX000007", color: "Gris", transmission: "automatique", fuel: "diesel", mileage: 67800, status: "rented", image: img("1552519507-da3b142c6e3d") },
  { id: "v8", brand: "Dacia", model: "Duster", year: 2021, plate: "CD-234-EF", vin: "VF1XXX000008", color: "Beige", transmission: "manuelle", fuel: "diesel", mileage: 89400, status: "out_of_service", image: img("1552519507-da3b142c6e3d") },
  { id: "v9", brand: "Toyota", model: "Corolla", year: 2023, plate: "GH-567-IJ", vin: "JTDXXX000009", color: "Blanc", transmission: "automatique", fuel: "hybride", mileage: 22150, status: "available", image: img("1621007947382-bb3c3994e3fb") },
  { id: "v10", brand: "Hyundai", model: "Kona Electric", year: 2024, plate: "KL-890-MN", vin: "TMAXXX000010", color: "Bleu", transmission: "automatique", fuel: "electrique", mileage: 5400, status: "available", image: img("1606664515524-ed2f786a0bd6") },
  { id: "v11", brand: "Renault", model: "Megane E-Tech", year: 2024, plate: "OP-123-QR", vin: "VF1XXX000011", color: "Gris", transmission: "automatique", fuel: "electrique", mileage: 3200, status: "rented", image: img("1580273916550-e323be2ae537") },
  { id: "v12", brand: "Peugeot", model: "308", year: 2022, plate: "ST-456-UV", vin: "VF3XXX000012", color: "Noir", transmission: "automatique", fuel: "essence", mileage: 41800, status: "maintenance", image: img("1494976388531-d1058494cdd8") },
];

export const alerts: Alert[] = [
  { id: "a1", vehicleId: "v2", message: "Vidange due dans 500 km", severity: "medium", date: "2026-07-10" },
  { id: "a2", vehicleId: "v5", message: "Assurance expire dans 5 jours", severity: "high", date: "2026-07-11" },
  { id: "a3", vehicleId: "v8", message: "Contrôle technique expiré", severity: "high", date: "2026-06-28" },
  { id: "a4", vehicleId: "v7", message: "Révision 60 000 km à planifier", severity: "medium", date: "2026-07-09" },
  { id: "a5", vehicleId: "v12", message: "Plaquettes de frein à remplacer", severity: "high", date: "2026-07-08" },
  { id: "a6", vehicleId: "v1", message: "Carte grise à mettre à jour", severity: "low", date: "2026-07-05" },
];

export const inspections: Inspection[] = [
  { id: "i1", vehicleId: "v2", type: "sortie", date: "2026-07-08", mileage: 27950, fuelLevel: 90, notes: "Rayure légère aile avant droite.", checklist: { tires: true, exteriorClean: true, interiorClean: true, spareWheel: true, triangle: true, vest: true }, photos: [img("1552519507-da3b142c6e3d"), img("1494976388531-d1058494cdd8")] },
  { id: "i2", vehicleId: "v2", type: "entree", date: "2026-06-25", mileage: 27100, fuelLevel: 45, notes: "RAS.", checklist: { tires: true, exteriorClean: false, interiorClean: true, spareWheel: true, triangle: true, vest: true }, photos: [img("1580273916550-e323be2ae537")] },
  { id: "i3", vehicleId: "v4", type: "sortie", date: "2026-07-05", mileage: 8850, fuelLevel: 100, notes: "Véhicule impeccable.", checklist: { tires: true, exteriorClean: true, interiorClean: true, spareWheel: true, triangle: true, vest: true }, photos: [img("1621007947382-bb3c3994e3fb")] },
];

export const maintenances: Maintenance[] = [
  { id: "m1", vehicleId: "v5", type: "Révision complète", scheduledDate: "2026-07-14", status: "in_progress", garage: "Garage Central" },
  { id: "m2", vehicleId: "v12", type: "Plaquettes de frein", scheduledDate: "2026-07-15", status: "upcoming", garage: "AutoPro Sud" },
  { id: "m3", vehicleId: "v2", type: "Vidange", scheduledDate: "2026-07-20", status: "upcoming", garage: "Garage Central" },
  { id: "m4", vehicleId: "v7", type: "Révision 60 000 km", scheduledDate: "2026-07-22", status: "upcoming", garage: "AutoPro Sud" },
  { id: "m5", vehicleId: "v1", type: "Changement pneus", scheduledDate: "2026-06-15", completedDate: "2026-06-15", status: "completed", cost: 480, garage: "PneuExpress" },
  { id: "m6", vehicleId: "v3", type: "Vidange", scheduledDate: "2026-05-20", completedDate: "2026-05-20", status: "completed", cost: 120, garage: "Garage Central" },
  { id: "m7", vehicleId: "v9", type: "Contrôle technique", scheduledDate: "2026-04-10", completedDate: "2026-04-10", status: "completed", cost: 85, garage: "Contrôle+" },
  { id: "m8", vehicleId: "v8", type: "Réparation moteur", scheduledDate: "2026-06-30", status: "in_progress", garage: "Mécanique Pro" },
];

export const documents: DocumentItem[] = [
  { id: "d1", vehicleId: "v1", type: "assurance", number: "ASS-2024-001", expiryDate: "2027-03-15" },
  { id: "d2", vehicleId: "v1", type: "controle_technique", number: "CT-2024-001", expiryDate: "2026-11-20" },
  { id: "d3", vehicleId: "v2", type: "assurance", number: "ASS-2024-002", expiryDate: "2026-08-10" },
  { id: "d4", vehicleId: "v5", type: "assurance", number: "ASS-2024-005", expiryDate: "2026-07-16" },
  { id: "d5", vehicleId: "v8", type: "controle_technique", number: "CT-2024-008", expiryDate: "2026-06-28" },
  { id: "d6", vehicleId: "v3", type: "assurance", number: "ASS-2024-003", expiryDate: "2027-01-05" },
  { id: "d7", vehicleId: "v4", type: "controle_technique", number: "CT-2024-004", expiryDate: "2028-02-14" },
  { id: "d8", vehicleId: "v7", type: "assurance", number: "ASS-2024-007", expiryDate: "2026-07-30" },
  { id: "d9", vehicleId: "v10", type: "carte_grise", number: "CG-2024-010", expiryDate: "2034-05-01" },
  { id: "d10", vehicleId: "v12", type: "controle_technique", number: "CT-2024-012", expiryDate: "2026-09-12" },
  { id: "d11", vehicleId: "v6", type: "assurance", number: "ASS-2024-006", expiryDate: "2026-12-01" },
  { id: "d12", vehicleId: "v11", type: "assurance", number: "ASS-2024-011", expiryDate: "2027-04-20" },
];

export const utilizationData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  rate: Math.round(55 + Math.sin(i / 3) * 15 + Math.random() * 10),
}));

export const statusLabels: Record<VehicleStatus, string> = {
  available: "Disponible",
  rented: "Loué",
  maintenance: "Maintenance",
  out_of_service: "Hors service",
};

export const fuelLabels: Record<FuelType, string> = {
  essence: "Essence",
  diesel: "Diesel",
  hybride: "Hybride",
  electrique: "Électrique",
};

export const docTypeLabels = {
  carte_grise: "Carte grise",
  assurance: "Assurance",
  controle_technique: "Contrôle technique",
  Contrat_de_location: "Contrat de location",
  Constat_assurance: "Constat assurance",
} as const;

export function getVehicle(id: string) {
  return vehicles.find((v) => v.id === id);
}

export function daysUntil(dateStr: string) {
  const d = new Date(dateStr).getTime();
  const now = new Date("2026-07-11").getTime();
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
}
