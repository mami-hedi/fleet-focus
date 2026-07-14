import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus, Search, Calendar, MapPin, Car, User, FileText,
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Upload, Camera, Trash2, Pencil
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useFleetStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/incidents")({
  head: () => ({ meta: [{ title: "Incidents — FleetOps" }] }),
  component: IncidentsPage,
});

type IncidentSeverity = "minor" | "moderate" | "severe";
type IncidentStatus = "open" | "in_progress" | "resolved";

interface Incident {
  id: string;
  vehicleId: string;
  driverId?: string;
  date: string;
  location: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  photos: string[];
  cost?: number;
  insuranceClaim?: boolean;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

// ─── Mock data ───
const initialIncidents: Incident[] = [
  {
    id: "i1",
    vehicleId: "v1",
    driverId: "d1",
    date: "2026-07-10",
    location: "Avenue Habib Bourguiba, Tunis",
    description: "Accrochage latéral avec un scooter. Rayure sur la portière conducteur.",
    severity: "minor",
    status: "resolved",
    photos: [],
    cost: 450,
    insuranceClaim: true,
    createdAt: "2026-07-10T10:30:00",
  },
  {
    id: "i2",
    vehicleId: "v3",
    driverId: "d2",
    date: "2026-07-12",
    location: "Autoroute A1, km 45",
    description: "Panne moteur sur autoroute. Véhicule remorqué.",
    severity: "severe",
    status: "in_progress",
    photos: [],
    cost: 2800,
    insuranceClaim: false,
    createdAt: "2026-07-12T14:15:00",
  },
  {
    id: "i3",
    vehicleId: "v2",
    date: "2026-07-14",
    location: "Parking centre commercial",
    description: "Coup de porte sur l'aile arrière droite.",
    severity: "minor",
    status: "open",
    photos: [],
    createdAt: "2026-07-14T09:00:00",
  },
];

const severityConfig = {
  minor: { label: "Léger", cls: "bg-info/10 text-info border-info/30", icon: AlertTriangle },
  moderate: { label: "Modéré", cls: "bg-warning/15 text-warning-foreground border-warning/30", icon: Clock },
  severe: { label: "Grave", cls: "bg-destructive/10 text-destructive border-destructive/30", icon: ShieldAlert },
};

const statusConfig = {
  open: { label: "Ouvert", cls: "bg-destructive/10 text-destructive" },
  in_progress: { label: "En cours", cls: "bg-warning/15 text-warning-foreground" },
  resolved: { label: "Résolu", cls: "bg-success/10 text-success" },
};

function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Incident | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const vehicles = useFleetStore((s) => s.vehicles);

  // ─── Filtrage ───
  const filtered = incidents.filter((inc) => {
    const matchSeverity = severityFilter === "all" || inc.severity === severityFilter;
    const matchStatus = statusFilter === "all" || inc.status === statusFilter;
    if (!query) return matchSeverity && matchStatus;
    const q = query.toLowerCase();
    const v = vehicles.find((x) => x.id === inc.vehicleId);
    return (
      matchSeverity &&
      matchStatus &&
      (inc.description.toLowerCase().includes(q) ||
        inc.location.toLowerCase().includes(q) ||
        v?.brand.toLowerCase().includes(q) ||
        v?.model.toLowerCase().includes(q) ||
        v?.plate.toLowerCase().includes(q))
    );
  });

  // ─── Pagination ───
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const getVisiblePages = () => {
    if (totalPages <= 5) return pageNumbers;
    if (safePage <= 3) return [...pageNumbers.slice(0, 5), "...", totalPages];
    if (safePage >= totalPages - 2) return [1, "...", ...pageNumbers.slice(totalPages - 5)];
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  };

  // ─── Actions ───
  const handleSave = (incident: Omit<Incident, "id" | "createdAt">, id?: string) => {
    if (id) {
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...incident, id, createdAt: i.createdAt } : i))
      );
    } else {
      setIncidents((prev) => [
        { ...incident, id: `i${Date.now()}`, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setIncidents((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const openCount = incidents.filter((i) => i.status === "open").length;
  const inProgressCount = incidents.filter((i) => i.status === "in_progress").length;
  const totalCost = incidents.reduce((sum, i) => sum + (i.cost || 0), 0);

  return (
    <AppLayout
      title="Incidents"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Déclarer un incident</span>
          <span className="sm:hidden">Déclarer</span>
        </Button>
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">

        {/* ─── Cartes stats ─── */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Ouverts" value={openCount} tint="bg-destructive/10 text-destructive" icon={AlertTriangle} />
          <SummaryCard label="En cours" value={inProgressCount} tint="bg-warning/15 text-warning-foreground" icon={Clock} />
          <SummaryCard label="Coût total" value={`${totalCost.toLocaleString("fr-FR")} €`} tint="bg-muted text-foreground" icon={FileText} />
        </div>

        {/* ─── Filtres ─── */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher un incident..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value as IncidentSeverity | "all"); setCurrentPage(1); }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Toutes gravités</option>
              <option value="minor">Léger</option>
              <option value="moderate">Modéré</option>
              <option value="severe">Grave</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as IncidentStatus | "all"); setCurrentPage(1); }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Tous statuts</option>
              <option value="open">Ouvert</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolu</option>
            </select>
          </div>
        </div>

        {/* ─── Tableau Desktop ─── */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Véhicule</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Gravité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Coût</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((inc) => {
                const v = vehicles.find((x) => x.id === inc.vehicleId);
                const sev = severityConfig[inc.severity];
                const st = statusConfig[inc.status];
                const SevIcon = sev.icon;

                return (
                  <TableRow key={inc.id}>
                    <TableCell>
                      {v && (
                        <Link to="/vehicles/$id" params={{ id: v.id }} className="flex items-center gap-3">
                          <img src={v.image} alt="" className="h-9 w-14 rounded object-cover" />
                          <div>
                            <p className="text-sm font-medium">{v.brand} {v.model}</p>
                            <p className="font-mono text-xs text-muted-foreground">{v.plate}</p>
                          </div>
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(inc.date).toLocaleDateString("fr-FR")}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {inc.location}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", sev.cls)}>
                        <SevIcon className="h-3 w-3" />
                        {sev.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", st.cls)}>
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {inc.cost ? `${inc.cost.toLocaleString("fr-FR")} €` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(inc); setDialogOpen(true); }}>
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(inc)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun incident trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── Cartes Mobile ─── */}
        <div className="sm:hidden space-y-3">
          {paginated.map((inc) => {
            const v = vehicles.find((x) => x.id === inc.vehicleId);
            const sev = severityConfig[inc.severity];
            const st = statusConfig[inc.status];
            const SevIcon = sev.icon;

            return (
              <div key={inc.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  {v && (
                    <Link to="/vehicles/$id" params={{ id: v.id }} className="flex items-center gap-3">
                      <img src={v.image} alt="" className="h-10 w-16 rounded object-cover" />
                      <div>
                        <p className="text-sm font-medium">{v.brand} {v.model}</p>
                        <p className="font-mono text-xs text-muted-foreground">{v.plate}</p>
                      </div>
                    </Link>
                  )}
                  <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", sev.cls)}>
                    <SevIcon className="h-3 w-3 inline mr-0.5" />
                    {sev.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Date</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(inc.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Statut</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", st.cls)}>
                      {st.label}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Lieu</p>
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {inc.location}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Description</p>
                    <p className="text-sm">{inc.description}</p>
                  </div>
                  {inc.cost && (
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Coût</p>
                      <p className="font-medium">{inc.cost.toLocaleString("fr-FR")} €</p>
                    </div>
                  )}
                  {inc.insuranceClaim && (
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Assurance</p>
                      <p className="text-success text-xs">Déclaré</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setEditing(inc); setDialogOpen(true); }}>
                    <FileText className="h-3 w-3" /> Détails
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => setDeleteTarget(inc)}>
                    <Trash2 className="h-3 w-3" /> Supprimer
                  </Button>
                </div>
              </div>
            );
          })}
          {paginated.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Aucun incident trouvé.
            </div>
          )}
        </div>

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-xs text-muted-foreground">
              Affichage {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
            </p>

            {/* Desktop */}
            <div className="hidden sm:flex items-center gap-1">
              <PageBtn onClick={() => goToPage(1)} disabled={safePage === 1} icon={<ChevronsLeft className="h-4 w-4" />} />
              <PageBtn onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} icon={<ChevronLeft className="h-4 w-4" />} />
              {getVisiblePages().map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={cn(
                      "h-8 w-8 rounded-lg text-sm font-medium transition-colors",
                      safePage === p ? "bg-primary text-primary-foreground" : "border border-input bg-background text-foreground hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
              <PageBtn onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages} icon={<ChevronRight className="h-4 w-4" />} />
              <PageBtn onClick={() => goToPage(totalPages)} disabled={safePage === totalPages} icon={<ChevronsRight className="h-4 w-4" />} />
            </div>

            {/* Mobile */}
            <div className="flex sm:hidden items-center gap-3 w-full">
              <button
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <span className="text-sm font-medium">{safePage} / {totalPages}</span>
              <button
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Dialog ─── */}
      {dialogOpen && (
        <IncidentDialog
          incident={editing}
          vehicles={vehicles}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {/* ─── Delete Dialog ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet incident ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `Cet incident du ${new Date(deleteTarget.date).toLocaleDateString("fr-FR")} sera définitivement supprimé.`}
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

/* ═══════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ═══════════════════════════════════════════════════════════════ */

function SummaryCard({ label, value, tint, icon: Icon }: { label: string; value: string | number; tint: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
      <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 sm:mt-2 flex items-center gap-2 sm:gap-3">
        <span className="text-xl sm:text-2xl font-semibold">{value}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tint)}>
          <Icon className="h-3 w-3 inline" />
        </span>
      </div>
    </div>
  );
}

function PageBtn({ onClick, disabled, icon }: { onClick: () => void; disabled: boolean; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-input bg-background text-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );
}

function IncidentDialog({
  incident,
  vehicles,
  onClose,
  onSave,
}: {
  incident: Incident | null;
  vehicles: any[];
  onClose: () => void;
  onSave: (i: Omit<Incident, "id" | "createdAt">, id?: string) => void;
}) {
  const [vehicleId, setVehicleId] = useState(incident?.vehicleId ?? "");
  const [date, setDate] = useState(incident?.date ?? new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState(incident?.location ?? "");
  const [description, setDescription] = useState(incident?.description ?? "");
  const [severity, setSeverity] = useState<IncidentSeverity>(incident?.severity ?? "minor");
  const [status, setStatus] = useState<IncidentStatus>(incident?.status ?? "open");
  const [cost, setCost] = useState(incident?.cost?.toString() ?? "");
  const [insuranceClaim, setInsuranceClaim] = useState(incident?.insuranceClaim ?? false);
  const [photos, setPhotos] = useState<string[]>(incident?.photos ?? []);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPhotos((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !date || !location || !description) return;
    onSave(
      {
        vehicleId,
        date,
        location,
        description,
        severity,
        status,
        cost: cost ? parseFloat(cost) : undefined,
        insuranceClaim,
        photos,
      },
      incident?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{incident ? "Modifier l'incident" : "Déclarer un incident"}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Véhicule */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Véhicule concerné *</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate}</option>
              ))}
            </select>
          </div>

          {/* Date & Lieu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Lieu *</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="Ex: Avenue Habib Bourguiba" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Décrivez l'incident..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Gravité & Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Gravité</label>
              <div className="flex rounded-lg border border-input bg-background p-0.5">
                {(["minor", "moderate", "severe"] as IncidentSeverity[]).map((s) => {
                  const cfg = severityConfig[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={cn(
                        "flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors",
                        severity === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Statut</label>
              <div className="flex rounded-lg border border-input bg-background p-0.5">
                {(["open", "in_progress", "resolved"] as IncidentStatus[]).map((s) => {
                  const cfg = statusConfig[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        "flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors",
                        status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coût & Assurance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Coût estimé (€)</label>
              <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setInsuranceClaim(!insuranceClaim)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  insuranceClaim
                    ? "border-success bg-success/10 text-success"
                    : "border-input bg-background text-muted-foreground"
                )}
              >
                {insuranceClaim ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {insuranceClaim ? "Déclaré assurance" : "Déclarer assurance"}
              </button>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Photos</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); Array.from(e.dataTransfer.files).forEach(handleFile); }}
              className={cn(
                "relative rounded-xl border-2 border-dashed p-4 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : photos.length > 0 ? "border-success bg-success/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <input type="file" accept="image/*" multiple onChange={(e) => Array.from(e.target.files ?? []).forEach(handleFile)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {photos.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap justify-center">
                    {photos.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPhotos((prev) => prev.filter((_, idx) => idx !== i)); }}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Cliquer pour ajouter d'autres photos</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted"><Camera className="h-4 w-4 text-muted-foreground" /></div>
                  <p className="text-xs text-muted-foreground">Cliquer ou glisser des photos</p>
                </div>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted">Annuler</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">{incident ? "Enregistrer" : "Déclarer"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}