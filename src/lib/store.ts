import { create } from "zustand";
import {
  vehicles as initialVehicles,
  inspections as initialInspections,
  maintenances as initialMaintenances,
  documents as initialDocuments,
  type Vehicle,
  type Inspection,
  type Maintenance,
  type DocumentItem,
} from "./mock-data";

interface FleetState {
  vehicles: Vehicle[];
  inspections: Inspection[];
  maintenances: Maintenance[];
  documents: DocumentItem[];
  addVehicle: (v: Omit<Vehicle, "id">) => string;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  addMaintenance: (m: Omit<Maintenance, "id">) => void;
  addInspection: (i: Omit<Inspection, "id">) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  vehicles: [...initialVehicles],
  inspections: [...initialInspections],
  maintenances: [...initialMaintenances],
  documents: [...initialDocuments],
  addVehicle: (v) => {
    const id = `v${Date.now()}`;
    set((s) => ({ vehicles: [{ ...v, id }, ...s.vehicles] }));
    return id;
  },
  updateVehicle: (id, patch) =>
    set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
  deleteVehicle: (id) =>
    set((s) => ({
      vehicles: s.vehicles.filter((v) => v.id !== id),
      inspections: s.inspections.filter((i) => i.vehicleId !== id),
      maintenances: s.maintenances.filter((m) => m.vehicleId !== id),
      documents: s.documents.filter((d) => d.vehicleId !== id),
    })),
  addMaintenance: (m) =>
    set((s) => ({ maintenances: [{ ...m, id: `m${Date.now()}` }, ...s.maintenances] })),
  addInspection: (i) =>
    set((s) => ({ inspections: [{ ...i, id: `i${Date.now()}` }, ...s.inspections] })),
}));

export const useVehicle = (id: string) =>
  useFleetStore((s) => s.vehicles.find((v) => v.id === id));
