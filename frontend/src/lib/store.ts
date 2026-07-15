import { create } from "zustand";
import {
  vehicles as initialVehicles,
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

interface FleetState {
  vehicles: Vehicle[];
  inspections: Inspection[];
  maintenances: Maintenance[];
  documents: DocumentItem[];
  history: HistoryEntry[];
  dismissedAlertIds: string[];
  addVehicle: (v: Omit<Vehicle, "id">) => string;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
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

export const useFleetStore = create<FleetState>((set) => ({
  vehicles: [...initialVehicles],
  inspections: [...initialInspections],
  maintenances: [...initialMaintenances],
  documents: [...initialDocuments],
  history: [],
  dismissedAlertIds: [],

  addVehicle: (v) => {
    const id = `v${Date.now()}`;
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      vehicleId: id,
      timestamp: nowIso(),
      kind: "vehicle_created",
      label: "Véhicule ajouté au parc",
      details: `${v.brand} ${v.model} — ${v.plate}`,
    };
    set((s) => ({
      vehicles: [{ ...v, id }, ...s.vehicles],
      history: [entry, ...s.history],
    }));
    return id;
  },

  updateVehicle: (id, patch) =>
    set((s) => {
      const before = s.vehicles.find((v) => v.id === id);
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
      return {
        vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        history: changed.length ? [entry, ...s.history] : s.history,
      };
    }),

  deleteVehicle: (id) =>
    set((s) => ({
      vehicles: s.vehicles.filter((v) => v.id !== id),
      inspections: s.inspections.filter((i) => i.vehicleId !== id),
      maintenances: s.maintenances.filter((m) => m.vehicleId !== id),
      documents: s.documents.filter((d) => d.vehicleId !== id),
      history: s.history.filter((h) => h.vehicleId !== id),
    })),

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