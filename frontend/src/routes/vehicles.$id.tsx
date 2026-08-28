import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Wrench, FileText, CheckCircle2, XCircle, AlertTriangle, Pencil, Trash2, Plus, History, Repeat, ClipboardCheck, CarFront, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { VehicleImage } from "@/components/VehicleImage";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fuelLabels, docTypeLabels, daysUntil, recurrenceLabels } from "@/lib/mock-data";
import { useFleetStore } from "@/lib/store";
import { resolveFileUrl } from "@/lib/files";
import { VehicleFormDialog } from "@/components/VehicleFormDialog";
import { MaintenanceDialog } from "@/components/MaintenanceDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vehicles/$id")({
  loader: ({ params }) => ({ id: params.id }),
  head: () => ({ meta: [{ title: "Véhicule — FleetOps" }] }),
  component: VehicleDetail,
  notFoundComponent: () => (
    <AppLayout title="Véhicule introuvable">
      <p className="text-sm text-muted-foreground">Ce véhicule n'existe pas ou a été supprimé.</p>
    </AppLayout>
  ),
});

// Normalise le champ "photos" d'une inspection : la colonne MySQL sous-jacente
// est en longtext (pas un vrai type JSON), donc selon le point d'entrée des
// données (cache store, réponse API avant redémarrage backend, etc.) la valeur
// peut arriver comme un array déjà parsé, une string JSON, ou null/undefined.
// Cette fonction garantit un array exploitable dans tous les cas, sans jamais
// faire planter le rendu.
function normalizePhotos(photos: unknown): string[] {
  if (Array.isArray(photos)) return photos;
  if (typeof photos === "string") {
    try {
      const parsed = JSON.parse(photos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Même logique de sécurité pour "checklist", qui partage la même colonne
// longtext en base et peut donc être sujette au même problème.
function normalizeChecklist(checklist: unknown): Record<string, boolean> {
  if (checklist && typeof checklist === "object" && !Array.isArray(checklist)) {
    return checklist as Record<string, boolean>;
  }
  if (typeof checklist === "string") {
    try {
      const parsed = JSON.parse(checklist);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function VehicleDetail() {
  const { id } = Route.useLoaderData();
  const vehicle = useFleetStore((s) => s.vehicles.find((v) => v.id === id));
  const inspections = useFleetStore((s) => s.inspections);
  const inspectionsLoading = useFleetStore((s) => s.inspectionsLoading);
  const fetchInspections = useFleetStore((s) => s.fetchInspections);
  const maintenances = useFleetStore((s) => s.maintenances);
  const maintenancesLoaded = useFleetStore((s) => s.maintenancesLoaded);
  const maintenancesLoading = useFleetStore((s) => s.maintenancesLoading);
  const fetchMaintenances = useFleetStore((s) => s.fetchMaintenances);
  const documents = useFleetStore((s) => s.documents);
  const documentsLoaded = useFleetStore((s) => s.documentsLoaded);
  const documentsLoading = useFleetStore((s) => s.documentsLoading);
  const fetchDocuments = useFleetStore((s) => s.fetchDocuments);
  const history = useFleetStore((s) => s.history);
  const historyLoading = useFleetStore((s) => s.historyLoading);
  const fetchVehicleHistory = useFleetStore((s) => s.fetchVehicleHistory);
  const deleteVehicle = useFleetStore((s) => s.deleteVehicle);
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);

  // Placé avant le "if (!vehicle) throw notFound()" pour respecter les règles des Hooks
  // (un hook ne peut pas être appelé après un return/throw conditionnel).
  // Les états des lieux sont filtrés côté API (vehicleId) et refetchés à chaque
  // arrivée sur la page. Maintenances et documents sont des listes globales
  // (filtrées ensuite côté client) : on ne les refetch que si elles n'ont pas
  // déjà été chargées ailleurs dans l'app, pour éviter un onglet vide quand on
  // atterrit directement sur cette fiche véhicule sans passer par /maintenance
  // ou /documents avant.
  useEffect(() => {
    fetchInspections({ vehicleId: id });
    fetchVehicleHistory(id);
    if (!maintenancesLoaded) fetchMaintenances();
    if (!documentsLoaded) fetchDocuments();
  }, [fetchInspections, fetchMaintenances, fetchDocuments, fetchVehicleHistory, id, maintenancesLoaded, documentsLoaded]);

  if (!vehicle) throw notFound();

  const vInspections = inspections.filter((i) => i.vehicleId === vehicle.id).sort((a, b) => b.date.localeCompare(a.date));
  const vMaintenances = maintenances.filter((m) => m.vehicleId === vehicle.id);
  const vDocs = documents.filter((d) => d.vehicleId === vehicle.id);
  const vHistory = history.filter((h) => h.vehicleId === vehicle.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const gallery = [vehicle.image, ...(vehicle.photos ?? [])].filter(Boolean);

  const handleDelete = async () => {
    try {
      await deleteVehicle(vehicle.id);
      toast.success("Véhicule supprimé");
      navigate({ to: "/vehicles" });
    } catch (err) {
      toast.error((err as Error).message || "Erreur lors de la suppression");
    }
  };

  return (
    <AppLayout
      title={`${vehicle.brand} ${vehicle.model}`}
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </Button>
        </div>
      }
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Link to="/vehicles" className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour aux véhicules
        </Link>

        <div className="grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-[300px_1fr]">
          <div className="flex flex-col gap-2">
            <VehicleImage src={vehicle.image} alt="" className="aspect-[16/10] w-full rounded-lg object-cover" iconClassName="h-10 w-10" />
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {gallery.map((p, i) => (
                  <VehicleImage
                    key={i}
                    src={p}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded-md border border-border object-cover"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{vehicle.year} · {vehicle.color}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {vehicle.brand} {vehicle.model}
                </h2>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{vehicle.plate}</p>
              </div>
              <StatusBadge status={vehicle.status} className="text-sm" />
            </div>
            <div className="mt-auto grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Kilométrage" value={`${vehicle.mileage.toLocaleString("fr-FR")} km`} />
              <Stat label="Carburant" value={fuelLabels[vehicle.fuel]} />
              <Stat label="Boîte" value={vehicle.transmission} />
              <Stat label="VIN" value={vehicle.vin} mono />
            </div>
          </div>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">Infos générales</TabsTrigger>
            <TabsTrigger value="inspections">États des lieux</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="grid gap-3 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
              <Info label="Marque" value={vehicle.brand} />
              <Info label="Modèle" value={vehicle.model} />
              <Info label="Année" value={String(vehicle.year)} />
              <Info label="Immatriculation" value={vehicle.plate} mono />
              <Info label="VIN" value={vehicle.vin} mono />
              <Info label="Couleur" value={vehicle.color} />
              <Info label="Boîte de vitesses" value={vehicle.transmission} />
              <Info label="Carburant" value={fuelLabels[vehicle.fuel]} />
              <Info label="Kilométrage actuel" value={`${vehicle.mileage.toLocaleString("fr-FR")} km`} />
            </div>
          </TabsContent>

          <TabsContent value="inspections" className="mt-4">
            <div className="flex items-center justify-between pb-3">
              <p className="text-sm text-muted-foreground">
                {inspectionsLoading ? "Chargement..." : `${vInspections.length} état${vInspections.length > 1 ? "s" : ""} des lieux`}
              </p>
              <Link to="/inspections/new" search={{ vehicleId: vehicle.id }}>
                <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nouvel état des lieux</Button>
              </Link>
            </div>
            {inspectionsLoading && vInspections.length === 0 ? (
              <TabLoading />
            ) : (
              <ol className="relative space-y-4 border-l-2 border-border pl-6">
                {vInspections.length === 0 && <p className="text-sm text-muted-foreground">Aucun état des lieux enregistré.</p>}
                {vInspections.map((ins) => {
                  const photos = normalizePhotos(ins.photos);
                  const checklist = normalizeChecklist(ins.checklist);
                  return (
                    <li key={ins.id} className="relative">
                      <span className={cn(
                        "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background",
                        ins.type === "sortie" ? "bg-info" : "bg-primary",
                      )}>
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold capitalize">{ins.type} · {new Date(ins.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}</p>
                            <p className="text-xs text-muted-foreground">{ins.mileage.toLocaleString("fr-FR")} km · Carburant {ins.fuelLevel}%</p>
                          </div>
                        </div>
                        {photos.length > 0 && (
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {photos.map((p, i) => {
                              const url = resolveFileUrl(p);
                              return url ? (
                                <img key={i} src={url} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />
                              ) : null;
                            })}
                          </div>
                        )}
                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                          {Object.entries(checklist).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-1.5">
                              {v ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                              <span className={v ? "text-foreground" : "text-muted-foreground line-through"}>{checklistLabel(k)}</span>
                            </div>
                          ))}
                        </div>
                        {ins.notes && <p className="mt-3 rounded-md bg-muted p-2 text-xs text-muted-foreground">{ins.notes}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="maintenance" className="mt-4">
            <div className="flex items-center justify-between pb-3">
              <p className="text-sm text-muted-foreground">
                {maintenancesLoading && !maintenancesLoaded ? "Chargement..." : `${vMaintenances.length} intervention${vMaintenances.length > 1 ? "s" : ""}`}
              </p>
              <Button size="sm" className="gap-1.5" onClick={() => setMaintOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Planifier une maintenance
              </Button>
            </div>
            {maintenancesLoading && !maintenancesLoaded ? (
              <TabLoading />
            ) : (
              <div className="rounded-xl border border-border bg-card">
                <ul className="divide-y divide-border">
                  {vMaintenances.length === 0 && <li className="p-4 text-sm text-muted-foreground">Aucune maintenance.</li>}
                  {vMaintenances.map((m) => (
                    <li key={m.id} className="flex items-center gap-4 p-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Wrench className="h-4 w-4 text-muted-foreground" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{m.type}</p>
                          {m.recurrence && m.recurrence !== "none" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              <Repeat className="h-3 w-3" /> {recurrenceLabels[m.recurrence]}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="mr-1 inline h-3 w-3" />
                          {new Date(m.completedDate ?? m.scheduledDate).toLocaleDateString("fr-FR")} · {m.garage}
                        </p>
                      </div>
                      {m.cost && <span className="text-sm font-medium">{m.cost} €</span>}
                      <MaintStatus status={m.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            {documentsLoading && !documentsLoaded ? (
              <TabLoading />
            ) : (
              <div className="rounded-xl border border-border bg-card">
                <ul className="divide-y divide-border">
                  {vDocs.length === 0 && <li className="p-4 text-sm text-muted-foreground">Aucun document.</li>}
                  {vDocs.map((d) => {
                    const days = daysUntil(d.expiryDate);
                    const urgency = days < 0 ? "expired" : days < 30 ? "soon" : "ok";
                    return (
                      <li key={d.id} className="flex items-center gap-4 p-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><FileText className="h-4 w-4 text-muted-foreground" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{docTypeLabels[d.type]}</p>
                          <p className="font-mono text-xs text-muted-foreground">{d.number}</p>
                        </div>
                        <UrgencyBadge urgency={urgency} days={days} date={d.expiryDate} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="flex items-center justify-between pb-3">
              <p className="text-sm text-muted-foreground">
                {historyLoading && vHistory.length === 0
                  ? "Chargement..."
                  : `${vHistory.length} événement${vHistory.length > 1 ? "s" : ""} enregistré${vHistory.length > 1 ? "s" : ""}`}
              </p>
            </div>
            {historyLoading && vHistory.length === 0 ? (
              <TabLoading />
            ) : vHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                <History className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Aucun historique pour l'instant. Les modifications, maintenances et états des lieux seront listés ici.
                </p>
              </div>
            ) : (
              <ol className="relative space-y-4 border-l-2 border-border pl-6">
                {vHistory.map((h) => {
                  const cfg = historyIcon(h.kind);
                  return (
                    <li key={h.id} className="relative">
                      <span className={cn(
                        "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background",
                        cfg.bg,
                      )}>
                        <cfg.Icon className="h-3 w-3 text-white" />
                      </span>
                      <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{h.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(h.timestamp).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        {h.details && <p className="mt-1 text-xs text-muted-foreground">{h.details}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <VehicleFormDialog open={editOpen} onOpenChange={setEditOpen} vehicle={vehicle} />
      <MaintenanceDialog open={maintOpen} onOpenChange={setMaintOpen} vehicleId={vehicle.id} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce véhicule ?</AlertDialogTitle>
            <AlertDialogDescription>
              {vehicle.brand} {vehicle.model} ({vehicle.plate}) sera retiré du parc avec ses documents et maintenances liés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-medium truncate", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

function TabLoading() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Chargement...
    </div>
  );
}

function checklistLabel(k: string) {
  const map: Record<string, string> = {
    tires: "Pneus", exteriorClean: "Prop. extérieure", interiorClean: "Prop. intérieure",
    spareWheel: "Roue de secours", triangle: "Triangle", vest: "Gilet",
  };
  return map[k] ?? k;
}

function MaintStatus({ status }: { status: "upcoming" | "in_progress" | "completed" }) {
  const s = {
    upcoming: { label: "À venir", cls: "bg-info/15 text-info" },
    in_progress: { label: "En cours", cls: "bg-warning/20 text-warning-foreground" },
    completed: { label: "Terminée", cls: "bg-success/15 text-success" },
  }[status];
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>;
}

function UrgencyBadge({ urgency, days, date }: { urgency: "expired" | "soon" | "ok"; days: number; date: string }) {
  const cfg = {
    expired: { cls: "bg-destructive/10 text-destructive border-destructive/30", label: `Expiré (${Math.abs(days)} j)` },
    soon: { cls: "bg-warning/15 text-warning-foreground border-warning/30", label: `Dans ${days} j` },
    ok: { cls: "bg-success/10 text-success border-success/20", label: new Date(date).toLocaleDateString("fr-FR") },
  }[urgency];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cfg.cls)}>
      {urgency !== "ok" && <AlertTriangle className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}

function historyIcon(kind: import("@/lib/mock-data").HistoryEntry["kind"]) {
  switch (kind) {
    case "vehicle_created":
      return { Icon: CarFront, bg: "bg-primary" };
    case "vehicle_updated":
      return { Icon: Pencil, bg: "bg-info" };
    case "vehicle_deleted":
      return { Icon: Trash2, bg: "bg-destructive" };
    case "maintenance_scheduled":
      return { Icon: Wrench, bg: "bg-warning" };
    case "inspection_created":
      return { Icon: ClipboardCheck, bg: "bg-success" };
    default:
      return { Icon: History, bg: "bg-muted-foreground" };
  }
}