import { create } from "zustand";
import { type Vehicle, type HistoryEntry } from "./mock-data";
import { vehicleService, type VehicleInput } from "./vehicleService";
import { documentService, type DocumentDTO, type DocumentInput } from "./documentService";
import { maintenanceService, type MaintenanceDTO, type MaintenanceInput } from "./maintenanceService";
import { fuelService, type FuelEntryDTO, type FuelInput, type FuelListParams } from "./fuelService";
import { incidentService, type Incident, type IncidentPayload, type IncidentListParams } from "./incidentService";
import { alertService, type AlertDTO, type AlertListParams } from "./alertService";
import { reservationService, type ReservationDTO, type ReservationInput, type ReservationListParams } from "./reservationService";
import { paymentService, type PaymentDTO, type PaymentInput, type PaymentListParams, type PaymentStats } from "./paymentService";
import {
  inspectionService,
  type InspectionDTO,
  type InspectionInput,
  type InspectionListParams,
} from "./inspectionService";
import { activityService, type ActivityDTO, type ActivityListParams } from "./activityService";
import { settingsService, type SettingsDTO, type SettingsInput } from "./settingsService";
import { ApiRequestError } from "./api-client";

interface FleetState {
  vehicles: Vehicle[];
  inspections: InspectionDTO[];
  maintenances: MaintenanceDTO[];
  documents: DocumentDTO[];
  incidents: Incident[];
  history: HistoryEntry[];
  historyLoading: boolean;
  fetchVehicleHistory: (vehicleId: string) => Promise<void>;

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

  // ─ États des lieux ─
  inspectionsLoaded: boolean;
  inspectionsLoading: boolean;
  inspectionsError: string | null;
  fetchInspections: (params?: InspectionListParams) => Promise<void>;
  addInspection: (input: InspectionInput) => Promise<InspectionDTO>;
  editInspection: (id: string, input: Partial<InspectionInput>) => Promise<void>;
  removeInspection: (id: string) => Promise<void>;

  fuelEntries: FuelEntryDTO[];
  fuelLoaded: boolean;
  fuelLoading: boolean;
  fuelError: string | null;
  fetchFuelEntries: (params?: FuelListParams) => Promise<void>;
  addFuelEntry: (input: FuelInput) => Promise<FuelEntryDTO>;
  editFuelEntry: (id: string, input: Partial<FuelInput>) => Promise<void>;
  removeFuelEntry: (id: string) => Promise<void>;

  // ─ Réservations ─
  reservations: ReservationDTO[];
  reservationsLoaded: boolean;
  reservationsLoading: boolean;
  reservationsError: string | null;
  fetchReservations: (params?: ReservationListParams) => Promise<void>;
  addReservation: (input: ReservationInput) => Promise<ReservationDTO>;
  editReservation: (id: string, input: Partial<ReservationInput>) => Promise<void>;
  removeReservation: (id: string) => Promise<void>;

  // ─ Paiements ─
  payments: PaymentDTO[];
  paymentsLoaded: boolean;
  paymentsLoading: boolean;
  paymentsError: string | null;
  paymentStats: PaymentStats | null;
  fetchPayments: (params?: PaymentListParams) => Promise<void>;
  fetchPaymentStats: () => Promise<void>;
  addPayment: (input: PaymentInput) => Promise<PaymentDTO>;
  editPayment: (id: string, input: Partial<PaymentInput>) => Promise<void>;
  removePayment: (id: string) => Promise<void>;

  // ─ Historique / Activité (backend, GET /api/activity) ─
  activities: ActivityDTO[];
  activitiesLoaded: boolean;
  activitiesLoading: boolean;
  activitiesError: string | null;
  fetchActivities: (params?: ActivityListParams) => Promise<void>;

  // ─ Paramètres (infos entreprise + notifications) ─
  settings: SettingsDTO | null;
  settingsLoaded: boolean;
  settingsLoading: boolean;
  settingsSaving: boolean;
  settingsError: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (input: SettingsInput) => Promise<void>;
}


function errorMessage(err: unknown): string {
  return err instanceof ApiRequestError ? err.detail : (err as Error).message;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  vehicles: [],
  inspections: [],
  maintenances: [],
  documents: [],
  incidents: [],
  fuelEntries: [],
  reservations: [],
  payments: [],
  history: [],
  historyLoading: false,

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
    set((s) => ({
      vehicles: [created, ...s.vehicles],
      // Invalide le journal pour qu'il se recharge à la prochaine visite
      activitiesLoaded: false,
    }));
    return created;
  },

  updateVehicle: async (id, patch) => {
    const updated = await vehicleService.update(id, patch);
    set((s) => ({
      vehicles: s.vehicles.map((v) => (v.id === id ? updated : v)),
      activitiesLoaded: false,
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
      activitiesLoaded: false,
    }));
  },

  // ─── Historique véhicule ──────────────────────────────────────────
  // Charge les entrées depuis le backend et les fusionne avec les entrées
  // locales éventuellement déjà présentes (dédupliquées par id).
  fetchVehicleHistory: async (vehicleId) => {
    if (get().historyLoading) return;
    set({ historyLoading: true });
    try {
      const remote = await vehicleService.getHistory(vehicleId);
      set((s) => {
        // On garde les entrées locales qui n'ont pas d'équivalent dans la réponse backend
        const remoteIds = new Set(remote.map((h) => h.id));
        const localOnly = s.history.filter(
          (h) => h.vehicleId === vehicleId && !remoteIds.has(h.id) && h.id.startsWith("h"),
        );
        const otherVehicles = s.history.filter((h) => h.vehicleId !== vehicleId);
        const merged = [...remote, ...localOnly].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        return { history: [...otherVehicles, ...merged], historyLoading: false };
      });
    } catch {
      set({ historyLoading: false });
    }
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
    set((s) => ({
      documents: [created, ...s.documents],
      activitiesLoaded: false,
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
    set((s) => ({
      maintenances: [...created, ...s.maintenances],
      activitiesLoaded: false,
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
    set((s) => ({
      incidents: [created, ...s.incidents],
      activitiesLoaded: false,
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

  // ─── États des lieux ──────────────────────────────────────────────
  inspectionsLoaded: false,
  inspectionsLoading: false,
  inspectionsError: null,

  fetchInspections: async (params) => {
    if (get().inspectionsLoading) return;
    set({ inspectionsLoading: true, inspectionsError: null });
    try {
      const inspections = await inspectionService.list(params);
      set({ inspections, inspectionsLoaded: true, inspectionsLoading: false });
    } catch (err) {
      set({ inspectionsError: errorMessage(err), inspectionsLoading: false });
    }
  },

  addInspection: async (input) => {
    const created = await inspectionService.create(input);
    // L'historique est déjà journalisé côté backend (onCreate -> logActivity dans
    // inspection.controller.js) : on invalide simplement le cache local du journal.
    set((s) => ({
      inspections: [created, ...s.inspections],
      // Le backend peut avoir relevé le kilométrage du véhicule (voir inspection.controller.js) :
      // on répercute la valeur renvoyée pour éviter d'afficher un kilométrage périmé sans refetch.
      vehicles: created.Vehicle
        ? s.vehicles.map((v) =>
            v.id === created.vehicleId ? { ...v, mileage: created.Vehicle!.mileage } : v,
          )
        : s.vehicles,
      activitiesLoaded: false,
    }));
    return created;
  },

  editInspection: async (id, input) => {
    const updated = await inspectionService.update(id, input);
    set((s) => ({
      inspections: s.inspections.map((i) => (i.id === id ? updated : i)),
    }));
  },

  removeInspection: async (id) => {
    await inspectionService.remove(id);
    set((s) => ({
      inspections: s.inspections.filter((i) => i.id !== id),
    }));
  },

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

  // ─── Réservations ────────────────────────────────────────────────────
  reservationsLoaded: false,
  reservationsLoading: false,
  reservationsError: null,

  fetchReservations: async (params) => {
    if (get().reservationsLoading) return;
    set({ reservationsLoading: true, reservationsError: null });
    try {
      const reservations = await reservationService.list(params);
      set({ reservations, reservationsLoaded: true, reservationsLoading: false });
    } catch (err) {
      set({ reservationsError: errorMessage(err), reservationsLoading: false });
    }
  },

  addReservation: async (input) => {
    const created = await reservationService.create(input);
    set((s) => ({ reservations: [created, ...s.reservations] }));
    return created;
  },

  editReservation: async (id, input) => {
    const updated = await reservationService.update(id, input);
    set((s) => ({
      reservations: s.reservations.map((r) => (r.id === id ? updated : r)),
    }));
  },

  removeReservation: async (id) => {
    await reservationService.remove(id);
    set((s) => ({
      reservations: s.reservations.filter((r) => r.id !== id),
      payments: s.payments.filter((p) => p.reservationId !== id),
    }));
  },

  // ─── Paiements ─────────────────────────────────────────────────────
  paymentsLoaded: false,
  paymentsLoading: false,
  paymentsError: null,
  paymentStats: null,

  fetchPayments: async (params) => {
    if (get().paymentsLoading) return;
    set({ paymentsLoading: true, paymentsError: null });
    try {
      const payments = await paymentService.list(params);
      set({ payments, paymentsLoaded: true, paymentsLoading: false });
    } catch (err) {
      set({ paymentsError: errorMessage(err), paymentsLoading: false });
    }
  },

  fetchPaymentStats: async () => {
    try {
      const paymentStats = await paymentService.getStats();
      set({ paymentStats });
    } catch {
      // stats non bloquantes
    }
  },

  addPayment: async (input) => {
    const created = await paymentService.create(input);
    set((s) => ({ payments: [created, ...s.payments] }));
    return created;
  },

  editPayment: async (id, input) => {
    const updated = await paymentService.update(id, input);
    set((s) => ({
      payments: s.payments.map((p) => (p.id === id ? updated : p)),
    }));
  },

  removePayment: async (id) => {
    await paymentService.remove(id);
    set((s) => ({
      payments: s.payments.filter((p) => p.id !== id),
    }));
  },

  // ─── Historique / Activité ─────────────────────────────────────────
  activities: [],
  activitiesLoaded: false,
  activitiesLoading: false,
  activitiesError: null,

  fetchActivities: async (params) => {
    if (get().activitiesLoading) return;
    set({ activitiesLoading: true, activitiesError: null });
    try {
      // Limite haute par défaut : le filtrage/la pagination se font côté client
      // dans activity.tsx, donc on récupère un historique large en un seul appel.
      const activities = await activityService.list({ limit: 200, ...params });
      set({ activities, activitiesLoaded: true, activitiesLoading: false });
    } catch (err) {
      set({ activitiesError: errorMessage(err), activitiesLoading: false });
    }
  },

  // ─── Paramètres ─────────────────────────────────────────────────────
  settings: null,
  settingsLoaded: false,
  settingsLoading: false,
  settingsSaving: false,
  settingsError: null,

  fetchSettings: async () => {
    if (get().settingsLoading) return;
    set({ settingsLoading: true, settingsError: null });
    try {
      const settings = await settingsService.get();
      set({ settings, settingsLoaded: true, settingsLoading: false });
    } catch (err) {
      set({ settingsError: errorMessage(err), settingsLoading: false });
    }
  },

  updateSettings: async (input) => {
    set({ settingsSaving: true, settingsError: null });
    try {
      const settings = await settingsService.update(input);
      set({ settings, settingsSaving: false });
    } catch (err) {
      set({ settingsError: errorMessage(err), settingsSaving: false });
      throw err;
    }
  },
}));

export const useVehicle = (id: string) =>
  useFleetStore((s) => s.vehicles.find((v) => v.id === id));