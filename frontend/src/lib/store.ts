import { create } from "zustand";
import {
  inspections as initialInspections,
  maintenances as initialMaintenances,
  documents as initialDocuments,
  recurrenceMonths,
  recurrenceLabels,
  type Vehicle,
  type Inspection,
  type Maintenance,
  type DocumentItem,
  type HistoryEntry,
} from "./mock-data";
import { vehicleService } from "./vehicleService";
import { ApiRequestError } from "./api-client";

interface FleetState {
  vehicles: Vehicle[];
  inspections: Inspection[];
  maintenances: Maintenance[];
  documents: DocumentItem[];
  history: HistoryEntry[];
  dismissedAlertIds: string[];
  vehiclesLoaded: boolean;
  vehiclesLoading: boolean;
  vehiclesError: string | null;
  fetchVehicles: () => Promise<void>;
  addVehicle: (v: Omit<Vehicle, "id">) => Promise<Vehicle>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addMaintenance: (m: Omit<Maintenance, "id">) => void;
  addInspection: (i: Omit<Inspection, "id">) => void;
  addDocument: (d: Omit<DocumentItem, "id">) => void;
  dismissAlert: (id: string) => void;
}

function nowIso() {
  return new Date().toISOString();
}

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export const useFleetStore = create<FleetState>((set, get) => ({
  vehicles: [],
  inspections: [...initialInspections],
  maintenances: [...initialMaintenances],
  documents: [...initialDocuments],
  history: [],
  dismissedAlertIds: [],
  vehiclesLoaded: false,
  vehiclesLoading: false,
  vehiclesError: null,

  fetchVehicles: async () => {
    // Évite les refetch en boucle si plusieurs composants montent en même temps.
    if (get().vehiclesLoading) return;
    set({ vehiclesLoading: true, vehiclesError: null });
    try {
      const vehicles = await vehicleService.list();
      set({ vehicles, vehiclesLoaded: true, vehiclesLoading: false });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.detail : (err as Error).message;
      set({ vehiclesError: message, vehiclesLoading: false });
    }
  },

  addVehicle: async (v) => {
    const created = await vehicleService.create(v);
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      vehicleId: created.id,
      timestamp: nowIso(),
      kind: "vehicle_created",
      label: "Véhicule ajouté au parc",
      details: `${created.brand} ${created.model} — ${created.plate}`,
    };
    set((s) => ({
      vehicles: [created, ...s.vehicles],
      history: [entry, ...s.history],
    }));
    return created;
  },

  updateVehicle: async (id, patch) => {
    const before = get().vehicles.find((v) => v.id === id);
    const updated = await vehicleService.update(id, patch);
    const changed = before
      ? (Object.keys(patch) as (keyof Vehicle)[]).filter(
          (k) => JSON.stringify(before[k]) !== JSON.stringify(patch[k]),
        )
      : [];
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      vehicleId: id,
      timestamp: nowIso(),
      kind: "vehicle_updated",
      label: "Fiche véhicule modifiée",
      details: changed.length ? `Champs : ${changed.join(", ")}` : undefined,
    };
    set((s) => ({
      vehicles: s.vehicles.map((v) => (v.id === id ? updated : v)),
      history: changed.length ? [entry, ...s.history] : s.history,
    }));
  },

  deleteVehicle: async (id) => {
    await vehicleService.remove(id);
    set((s) => ({
      vehicles: s.vehicles.filter((v) => v.id !== id),
      inspections: s.inspections.filter((i) => i.vehicleId !== id),
      maintenances: s.maintenances.filter((m) => m.vehicleId !== id),
      documents: s.documents.filter((d) => d.vehicleId !== id),
      history: s.history.filter((h) => h.vehicleId !== id),
    }));
  },

  addMaintenance: (m) =>
    set((s) => {
      const rec = m.recurrence ?? "none";
      const months = recurrenceMonths[rec];
      const seriesId = rec !== "none" ? `s${Date.now()}` : undefined;
      const base = Date.now();
      const items: Maintenance[] = [];
      const count = rec === "none" ? 1 : 4;
      for (let i = 0; i < count; i++) {
        items.push({
          ...m,
          id: `m${base}-${i}`,
          scheduledDate: i === 0 ? m.scheduledDate : addMonths(m.scheduledDate, months * i),
          seriesId,
          recurrence: rec,
          status: i === 0 ? m.status : "upcoming",
        });
      }
      const label =
        rec === "none"
          ? "Maintenance planifiée"
          : `Maintenance récurrente planifiée (${recurrenceLabels[rec].toLowerCase()})`;
      const entry: HistoryEntry = {
        id: `h${base}`,
        vehicleId: m.vehicleId,
        timestamp: nowIso(),
        kind: "maintenance_scheduled",
        label,
        details: `${m.type} — ${m.garage} — ${new Date(m.scheduledDate).toLocaleDateString("fr-FR")}`,
      };
      return {
        maintenances: [...items, ...s.maintenances],
        history: [entry, ...s.history],
      };
    }),

  addInspection: (i) =>
    set((s) => {
      const id = `i${Date.now()}`;
      const entry: HistoryEntry = {
        id: `h${Date.now()}`,
        vehicleId: i.vehicleId,
        timestamp: nowIso(),
        kind: "inspection_created",
        label: `État des lieux (${i.type})`,
        details: `${i.mileage.toLocaleString("fr-FR")} km — carburant ${i.fuelLevel}%`,
      };
      return {
        inspections: [{ ...i, id }, ...s.inspections],
        history: [entry, ...s.history],
      };
    }),

  addDocument: (d) =>
    set((s) => {
      const id = `doc-${Date.now()}`;
      const entry: HistoryEntry = {
        id: `h${Date.now()}`,
        vehicleId: d.vehicleId,
        timestamp: nowIso(),
        kind: "document_created",
        label: "Document ajouté",
        details: `${d.type} — ${d.number}`,
      };
      return {
        documents: [{ ...d, id }, ...s.documents],
        history: [entry, ...s.history],
      };
    }),

  dismissAlert: (id) =>
    set((s) => ({
      dismissedAlertIds: [...s.dismissedAlertIds, id],
    })),
}));

export const useVehicle = (id: string) =>
  useFleetStore((s) => s.vehicles.find((v) => v.id === id));