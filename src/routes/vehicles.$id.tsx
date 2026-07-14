import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, Wrench, FileText, CheckCircle2, XCircle, AlertTriangle, Pencil, Trash2, Plus, History, Repeat, ClipboardCheck, CarFront } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
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

function VehicleDetail() {
  const { id } = Route.useLoaderData();
  const vehicle = useFleetStore((s) => s.vehicles.find((v) => v.id === id));
  const inspections = useFleetStore((s) => s.inspections);
  const maintenances = useFleetStore((s) => s.maintenances);
  const documents = useFleetStore((s) => s.documents);
  const history = useFleetStore((s) => s.history);
  const deleteVehicle = useFleetStore((s) => s.deleteVehicle);
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);

  if (!vehicle) throw notFound();

  const vInspections = inspections.filter((i) => i.vehicleId === vehicle.id).sort((a, b) => b.date.localeCompare(a.date));
  const vMaintenances = maintenances.filter((m) => m.vehicleId === vehicle.id);
  const vDocs = documents.filter((d) => d.vehicleId === vehicle.id);
  const vHistory = history.filter((h) => h.vehicleId === vehicle.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const gallery = [vehicle.image, ...(vehicle.photos ?? [])].filter(Boolean);

  const handleDelete = () => {
    deleteVehicle(vehicle.id);
    toast.success("Véhicule supprimé");
    navigate({ to: "/vehicles" });
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
            <img src={vehicle.image} alt="" className="aspect-[16/10] w-full rounded-lg object-cover" />
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {gallery.map((p, i) => (
                  <img
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
              <p className="text-sm text-muted-foreground">{vInspections.length} état{vInspections.length > 1 ? "s" : ""} des lieux</p>
              <Link to="/inspections/new" search={{ vehicleId: vehicle.id }}>
                <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nouvel état des lieux</Button>
              </Link>
            </div>
            <ol className="relative space-y-4 border-l-2 border-border pl-6">
              {vInspections.length === 0 && <p className="text-sm text-muted-foreground">Aucun état des lieux enregistré.</p>}
              {vInspections.map((ins) => (
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
                    {ins.photos.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {ins.photos.map((p, i) => (
                          <img key={i} src={p} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />
                        ))}
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                      {Object.entries(ins.checklist).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5">
                          {v ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                          <span className={v ? "text-foreground" : "text-muted-foreground line-through"}>{checklistLabel(k)}</span>
                        </div>
                      ))}
                    </div>
                    {ins.notes && <p className="mt-3 rounded-md bg-muted p-2 text-xs text-muted-foreground">{ins.notes}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-4">
            <div className="flex items-center justify-between pb-3">
              <p className="text-sm text-muted-foreground">{vMaintenances.length} intervention{vMaintenances.length > 1 ? "s" : ""}</p>
              <Button size="sm" className="gap-1.5" onClick={() => setMaintOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Planifier une maintenance
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card">
              <ul className="divide-y divide-border">
                {vMaintenances.length === 0 && <li className="p-4 text-sm text-muted-foreground">Aucune maintenance.</li>}
                {vMaintenances.map((m) => (
                  <li key={m.id} className="flex items-center gap-4 p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Wrench className="h-4 w-4 text-muted-foreground" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.type}</p>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {new Date(m.scheduledDate).toLocaleDateString("fr-FR")} · {m.garage}
                      </p>
                    </div>
                    {m.cost && <span className="text-sm font-medium">{m.cost} €</span>}
                    <MaintStatus status={m.status} />
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
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
