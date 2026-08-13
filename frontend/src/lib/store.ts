import { create } from "zustand";
import {
  inspections as initialInspections,
  type Vehicle,
  type Inspection,
  type HistoryEntry,
} from "./mock-data";
import { vehicleService, type VehicleInput } from "./vehicleService";
import { documentService, type DocumentDTO, type DocumentInput } from "./documentService";
import { maintenanceService, type MaintenanceDTO, type MaintenanceInput } from "./maintenanceService";
import { fuelService, type FuelEntryDTO, type FuelInput, type FuelListParams } from "./fuelService";
import { incidentService, type Incident, type IncidentPayload, type IncidentListParams } from "./incidentService";
import { alertService, type AlertDTO, type AlertListParams } from "./alertService";
import { ApiRequestError } from "./api-client";

interface FleetState {
  vehicles: Vehicle[];
  inspections: Inspection[];
  maintenances: MaintenanceDTO[];
  documents: DocumentDTO[];
  incidents: Incident[];
  history: HistoryEntry[];

  alerts: AlertDTO[];
  alertsLoaded: boolean;
  alertsLoading: boolean;
  alertsError: string | null;
  fetchAlerts: (params?: AlertListParams) => Promise<void>;
  dismissAlert: (alertKey: string) => Promise<void>;

  vehiclesLoaded: boolean;
  vehiclesLoading: boolean;
  vehiclesError: string | null;
  fetchVehicles: () => Promise<void>;
  addVehicle: (v: VehicleInput) => Promise<Vehicle>;
  updateVehicle: (id: string, patch: VehicleInput) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  documentsLoaded: boolean;
  documentsLoading: boolean;
  documentsError: string | null;
  fetchDocuments: () => Promise<void>;
  addDocument: (input: DocumentInput) => Promise<DocumentDTO>;
  editDocument: (id: number, input: Partial<DocumentInput>) => Promise<void>;
  removeDocument: (id: number) => Promise<void>;

  maintenancesLoaded: boolean;
  maintenancesLoading: boolean;
  maintenancesError: string | null;
  fetchMaintenances: () => Promise<void>;
  addMaintenance: (input: MaintenanceInput) => Promise<MaintenanceDTO[]>;
  editMaintenance: (id: string, input: Partial<MaintenanceInput>) => Promise<void>;
  removeMaintenance: (id: string) => Promise<void>;

  incidentsLoaded: boolean;
  incidentsLoading: boolean;
  incidentsError: string | null;
  fetchIncidents: (params?: IncidentListParams) => Promise<void>;
  addIncident: (input: IncidentPayload) => Promise<Incident>;
  updateIncident: (id: string, input: Partial<IncidentPayload>) => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;

  addInspection: (i: Omit<Inspection, "id">) => void;

  fuelEntries: FuelEntryDTO[];
  fuelLoaded: boolean;
  fuelLoading: boolean;
  fuelError: string | null;
  fetchFuelEntries: (params?: FuelListParams) => Promise<void>;
  addFuelEntry: (input: FuelInput) => Promise<FuelEntryDTO>;
  editFuelEntry: (id: string, input: Partial<FuelInput>) => Promise<void>;
  removeFuelEntry: (id: string) => Promise<void>;
}

function nowIso() {
  return new Date().toISOString();
}

function errorMessage(err: unknown): string {
  return err instanceof ApiRequestError ? err.detail : (err as Error).message;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  vehicles: [],
  inspections: [...initialInspections],
  maintenances: [],
  documents: [],
  incidents: [],
  fuelEntries: [],
  history: [],

  alerts: [],
  alertsLoaded: false,
  alertsLoading: false,
  alertsError: null,

  fetchAlerts: async (params) => {
    if (get().alertsLoading) return;
    set({ alertsLoading: true, alertsError: null });
    try {
      const alerts = await alertService.list(params);
      set({ alerts, alertsLoaded: true, alertsLoading: false });
    } catch (err) {
      set({ alertsError: errorMessage(err), alertsLoading: false });
    }
  },

  // Optimiste : on retire l'alerte de la liste locale immédiatement, puis on
  // persiste côté backend. Si l'appel échoue, on la remet (rollback).
  dismissAlert: async (alertKey) => {
    const previous = get().alerts;
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== alertKey) }));
    try {
      await alertService.dismiss(alertKey);
    } catch (err) {
      set({ alerts: previous, alertsError: errorMessage(err) });
    }
  },

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
      set({ vehiclesError: errorMessage(err), vehiclesLoading: false });
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
    const updated = await vehicleService.update(id, patch);
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      vehicleId: id,
      timestamp: nowIso(),
      kind: "vehicle_updated",
      label: "Fiche véhicule modifiée",
    };
    set((s) => ({
      vehicles: s.vehicles.map((v) => (v.id === id ? updated : v)),
      history: [entry, ...s.history],
    }));
  },

  deleteVehicle: async (id) => {
    await vehicleService.remove(id);
    set((s) => ({
      vehicles: s.vehicles.filter((v) => v.id !== id),
      inspections: s.inspections.filter((i) => i.vehicleId !== id),
      maintenances: s.maintenances.filter((m) => m.vehicleId !== id),
      documents: s.documents.filter((d) => d.vehicleId !== id),
      incidents: s.incidents.filter((i) => i.vehicleId !== id),
      fuelEntries: s.fuelEntries.filter((f) => f.vehicleId !== id),
      history: s.history.filter((h) => h.vehicleId !== id),
    }));
  },

  documentsLoaded: false,
  documentsLoading: false,
  documentsError: null,

  fetchDocuments: async () => {
    if (get().documentsLoading) return;
    set({ documentsLoading: true, documentsError: null });
    try {
      const documents = await documentService.list();
      set({ documents, documentsLoaded: true, documentsLoading: false });
    } catch (err) {
      set({ documentsError: errorMessage(err), documentsLoading: false });
    }
  },

  addDocument: async (input) => {
    const created = await documentService.create(input);
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      vehicleId: created.vehicleId,
      timestamp: nowIso(),
      kind: "document_created",
      label: "Document ajouté",
      details: `${created.type} — ${created.number}`,
    };
    set((s) => ({
      documents: [created, ...s.documents],
      history: [entry, ...s.history],
    }));
    return created;
  },

  editDocument: async (id, input) => {
    const updated = await documentService.update(id, input);
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? updated : d)),
    }));
  },

  removeDocument: async (id) => {
    await documentService.remove(id);
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
    }));
  },

  maintenancesLoaded: false,
  maintenancesLoading: false,
  maintenancesError: null,

  fetchMaintenances: async () => {
    if (get().maintenancesLoading) return;
    set({ maintenancesLoading: true, maintenancesError: null });
    try {
      const maintenances = await maintenanceService.list();
      set({ maintenances, maintenancesLoaded: true, maintenancesLoading: false });
    } catch (err) {
      set({ maintenancesError: errorMessage(err), maintenancesLoading: false });
    }
  },

  // Le backend génère lui-même les occurrences récurrentes (voir maintenance.controller.js)
  // et renvoie donc un tableau, même pour une maintenance simple (1 seul élément).
  addMaintenance: async (input) => {
    const created = await maintenanceService.create(input);
    const first = created[0];
    const label =
      !first.recurrence || first.recurrence === "none"
        ? "Maintenance planifiée"
        : "Maintenance récurrente planifiée";
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      vehicleId: first.vehicleId,
      timestamp: nowIso(),
      kind: "maintenance_scheduled",
      label,
      details: `${first.type} — ${first.garage} — ${new Date(first.scheduledDate).toLocaleDateString("fr-FR")}`,
    };
    set((s) => ({
      maintenances: [...created, ...s.maintenances],
      history: [entry, ...s.history],
    }));
    return created;
  },

  editMaintenance: async (id, input) => {
    const updated = await maintenanceService.update(id, input);
    set((s) => ({
      maintenances: s.maintenances.map((m) => (m.id === id ? updated : m)),
    }));
  },

  removeMaintenance: async (id) => {
    await maintenanceService.remove(id);
    set((s) => ({
      maintenances: s.maintenances.filter((m) => m.id !== id),
    }));
  },

  incidentsLoaded: false,
  incidentsLoading: false,
  incidentsError: null,

  fetchIncidents: async (params) => {
    if (get().incidentsLoading) return;
    set({ incidentsLoading: true, incidentsError: null });
    try {
      const incidents = await incidentService.list(params);
      set({ incidents, incidentsLoaded: true, incidentsLoading: false });
    } catch (err) {
      set({ incidentsError: errorMessage(err), incidentsLoading: false });
    }
  },

  addIncident: async (input) => {
    const created = await incidentService.create(input);
    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      vehicleId: created.vehicleId,
      timestamp: nowIso(),
      kind: "incident_created",
      label: "Incident déclaré",
      details: `${created.description} — ${created.location}`,
    };
    set((s) => ({
      incidents: [created, ...s.incidents],
      history: [entry, ...s.history],
    }));
    return created;
  },

  updateIncident: async (id, input) => {
    const updated = await incidentService.update(id, input);
    set((s) => ({
      incidents: s.incidents.map((i) => (i.id === id ? updated : i)),
    }));
  },

  deleteIncident: async (id) => {
    await incidentService.remove(id);
    set((s) => ({
      incidents: s.incidents.filter((i) => i.id !== id),
    }));
  },

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

  // ─── Carburant ──────────────────────────────────────────────────────────
  fuelLoaded: false,
  fuelLoading: false,
  fuelError: null,

  fetchFuelEntries: async (params) => {
    if (get().fuelLoading) return;
    set({ fuelLoading: true, fuelError: null });
    try {
      const fuelEntries = await fuelService.list(params);
      set({ fuelEntries, fuelLoaded: true, fuelLoading: false });
    } catch (err) {
      set({ fuelError: errorMessage(err), fuelLoading: false });
    }
  },

  addFuelEntry: async (input) => {
    const created = await fuelService.create(input);
    set((s) => ({ fuelEntries: [created, ...s.fuelEntries] }));
    return created;
  },

  editFuelEntry: async (id, input) => {
    const updated = await fuelService.update(id, input);
    set((s) => ({
      fuelEntries: s.fuelEntries.map((f) => (f.id === id ? updated : f)),
    }));
  },

  removeFuelEntry: async (id) => {
    await fuelService.remove(id);
    set((s) => ({
      fuelEntries: s.fuelEntries.filter((f) => f.id !== id),
    }));
  },
}));

export const useVehicle = (id: string) =>
  useFleetStore((s) => s.vehicles.find((v) => v.id === id));