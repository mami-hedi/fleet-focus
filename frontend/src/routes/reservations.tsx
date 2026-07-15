import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus, Search, Car, Calendar, Clock, User, MapPin,
  CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, X, Pencil, Trash2, ArrowRight
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

export const Route = createFileRoute("/reservations")({
  head: () => ({ meta: [{ title: "Réservations — FleetOps" }] }),
  component: ReservationsPage,
});

type ReservationStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
type ReservationType = "transfer" | "day_trip" | "multi_day" | "airport";

interface Reservation {
  id: string;
  vehicleId: string;
  driverId?: string;
  type: ReservationType;
  status: ReservationStatus;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  clientName: string;
  clientPhone: string;
  notes?: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

// ─── Labels ───
const typeLabels: Record<ReservationType, string> = {
  transfer: "Transfert",
  day_trip: "Journée",
  multi_day: "Plusieurs jours",
  airport: "Aéroport",
};

const statusLabels: Record<ReservationStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

const statusConfig: Record<ReservationStatus, { cls: string; icon: React.ElementType }> = {
  pending: { cls: "bg-warning/15 text-warning-foreground border-warning/30", icon: AlertCircle },
  confirmed: { cls: "bg-info/10 text-info border-info/30", icon: CheckCircle2 },
  in_progress: { cls: "bg-primary/10 text-primary border-primary/30", icon: Car },
  completed: { cls: "bg-success/10 text-success border-success/30", icon: CheckCircle2 },
  cancelled: { cls: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

// ─── Mock data ───
const initialReservations: Reservation[] = [
  {
    id: "r1",
    vehicleId: "v1",
    driverId: "d1",
    type: "airport",
    status: "confirmed",
    startDate: "2026-07-15",
    startTime: "08:00",
    endDate: "2026-07-15",
    endTime: "10:00",
    pickupLocation: "Hôtel Carlton, Tunis",
    dropoffLocation: "Aéroport Tunis-Carthage",
    clientName: "Jean Dupont",
    clientPhone: "+33 6 12 34 56 78",
    notes: "Vol TU 215, terminal 2",
    createdAt: "2026-07-14T10:00:00",
  },
  {
    id: "r2",
    vehicleId: "v1",
    driverId: "d2",
    type: "transfer",
    status: "pending",
    startDate: "2026-07-15",
    startTime: "14:00",
    endDate: "2026-07-15",
    endTime: "15:30",
    pickupLocation: "Aéroport Tunis-Carthage",
    dropoffLocation: "Sidi Bou Saïd",
    clientName: "Marie Martin",
    clientPhone: "+33 7 23 45 67 89",
    createdAt: "2026-07-14T11:30:00",
  },
  {
    id: "r3",
    vehicleId: "v2",
    type: "day_trip",
    status: "in_progress",
    startDate: "2026-07-14",
    startTime: "09:00",
    endDate: "2026-07-14",
    endTime: "18:00",
    pickupLocation: "Hôtel Laico",
    dropoffLocation: "Hôtel Laico",
    clientName: "Groupe Voyages Evasion",
    clientPhone: "+216 71 234 567",
    notes: "Circuit Carthage + Sidi Bou Saïd",
    createdAt: "2026-07-10T14:00:00",
  },
  {
    id: "r4",
    vehicleId: "v3",
    type: "multi_day",
    status: "confirmed",
    startDate: "2026-07-16",
    startTime: "08:00",
    endDate: "2026-07-18",
    endTime: "20:00",
    pickupLocation: "Tunis centre",
    dropoffLocation: "Djerba",
    clientName: "Famille Alves",
    clientPhone: "+351 912 345 678",
    notes: "3 jours, hébergement inclus",
    createdAt: "2026-07-12T09:00:00",
  },
];

function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const vehicles = useFleetStore((s) => s.vehicles);

  // ─── Filtrage ───
  const filtered = reservations.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchDate = !dateFilter || r.startDate === dateFilter || r.endDate === dateFilter;
    if (!query) return matchStatus && matchDate;
    const q = query.toLowerCase();
    const v = vehicles.find((x) => x.id === r.vehicleId);
    return (
      matchStatus &&
      matchDate &&
      (r.clientName.toLowerCase().includes(q) ||
        r.pickupLocation.toLowerCase().includes(q) ||
        r.dropoffLocation.toLowerCase().includes(q) ||
        v?.brand.toLowerCase().includes(q) ||
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
  const handleSave = (res: Omit<Reservation, "id" | "createdAt">, id?: string) => {
    if (id) {
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...res, id, createdAt: prev.find((x) => x.id === id)?.createdAt || new Date().toISOString() } : r)));
    } else {
      setReservations((prev) => [{ ...res, id: `r${Date.now()}`, createdAt: new Date().toISOString() }, ...prev]);
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setReservations((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  // ─── Stats ───
  const today = new Date().toISOString().split("T")[0];
  const todayCount = reservations.filter((r) => r.startDate === today && r.status !== "cancelled").length;
  const pendingCount = reservations.filter((r) => r.status === "pending").length;
  const inProgressCount = reservations.filter((r) => r.status === "in_progress").length;

  // ─── Conflits : vérifier si un véhicule a plusieurs réservations qui se chevauchent ───
  const conflicts = useMemo(() => {
    const conflicts: { vehicleId: string; reservations: Reservation[] }[] = [];
    const byVehicle: Record<string, Reservation[]> = {};
    reservations.forEach((r) => {
      if (r.status === "cancelled") return;
      if (!byVehicle[r.vehicleId]) byVehicle[r.vehicleId] = [];
      byVehicle[r.vehicleId].push(r);
    });

    Object.entries(byVehicle).forEach(([vehicleId, resList]) => {
      for (let i = 0; i < resList.length; i++) {
        for (let j = i + 1; j < resList.length; j++) {
          const a = resList[i];
          const b = resList[j];
          const aStart = new Date(`${a.startDate}T${a.startTime}`).getTime();
          const aEnd = new Date(`${a.endDate}T${a.endTime}`).getTime();
          const bStart = new Date(`${b.startDate}T${b.startTime}`).getTime();
          const bEnd = new Date(`${b.endDate}T${b.endTime}`).getTime();

          if (aStart < bEnd && bStart < aEnd) {
            const existing = conflicts.find((c) => c.vehicleId === vehicleId);
            if (existing) {
              if (!existing.reservations.find((r) => r.id === a.id)) existing.reservations.push(a);
              if (!existing.reservations.find((r) => r.id === b.id)) existing.reservations.push(b);
            } else {
              conflicts.push({ vehicleId, reservations: [a, b] });
            }
          }
        }
      }
    });
    return conflicts;
  }, [reservations]);

  return (
    <AppLayout
      title="Réservations"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle réservation</span>
          <span className="sm:hidden">Réserver</span>
        </Button>
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">

        {/* ─── Alertes conflits ─── */}
        {conflicts.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Conflits de réservation détectés</span>
            </div>
            {conflicts.map((c) => {
              const v = vehicles.find((x) => x.id === c.vehicleId);
              return (
                <div key={c.vehicleId} className="text-xs text-muted-foreground pl-6">
                  <span className="font-medium text-foreground">{v?.brand} {v?.model} ({v?.plate})</span>
                  {" : "}{c.reservations.length} réservations qui se chevauchent
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Cartes stats ─── */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Aujourd'hui" value={todayCount} tint="bg-primary/10 text-primary" icon={Calendar} />
          <SummaryCard label="En attente" value={pendingCount} tint="bg-warning/15 text-warning-foreground" icon={AlertCircle} />
          <SummaryCard label="En cours" value={inProgressCount} tint="bg-success/10 text-success" icon={Car} />
        </div>

        {/* ─── Filtres ─── */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher client, lieu, véhicule..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as ReservationStatus | "all"); setCurrentPage(1); }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {(query || statusFilter !== "all" || dateFilter) && (
              <button
                onClick={() => { setQuery(""); setStatusFilter("all"); setDateFilter(""); setCurrentPage(1); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-3 w-3" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* ─── Tableau Desktop ─── */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Véhicule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Trajet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((r) => {
                const v = vehicles.find((x) => x.id === r.vehicleId);
                const st = statusConfig[r.status];
                const StatusIcon = st.icon;
                const isMultiDay = r.startDate !== r.endDate;

                return (
                  <TableRow key={r.id}>
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
                      <span className="text-sm">{typeLabels[r.type]}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{r.clientName}</p>
                        <p className="text-xs text-muted-foreground">{r.clientPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {isMultiDay
                            ? `${new Date(r.startDate).toLocaleDateString("fr-FR")} → ${new Date(r.endDate).toLocaleDateString("fr-FR")}`
                            : new Date(r.startDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                        </p>
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {r.startTime} → {r.endTime}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-sm">
                        <p className="truncate">{r.pickupLocation}</p>
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <ArrowRight className="h-3 w-3" />
                          <span className="truncate">{r.dropoffLocation}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", st.cls)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusLabels[r.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(r); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(r)}>
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
                    Aucune réservation trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── Cartes Mobile ─── */}
        <div className="sm:hidden space-y-3">
          {paginated.map((r) => {
            const v = vehicles.find((x) => x.id === r.vehicleId);
            const st = statusConfig[r.status];
            const StatusIcon = st.icon;
            const isMultiDay = r.startDate !== r.endDate;

            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
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
                  <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", st.cls)}>
                    <StatusIcon className="h-3 w-3 inline mr-0.5" />
                    {statusLabels[r.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Type</p>
                    <p>{typeLabels[r.type]}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Client</p>
                    <p className="font-medium">{r.clientName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Date</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {isMultiDay
                        ? `${new Date(r.startDate).toLocaleDateString("fr-FR")} → ${new Date(r.endDate).toLocaleDateString("fr-FR")}`
                        : new Date(r.startDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </p>
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {r.startTime} → {r.endTime}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Trajet</p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{r.pickupLocation}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{r.dropoffLocation}</span>
                    </p>
                  </div>
                  {r.notes && (
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase text-muted-foreground">Notes</p>
                      <p className="text-xs text-muted-foreground">{r.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setEditing(r); setDialogOpen(true); }}>
                    <Pencil className="h-3 w-3" /> Modifier
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => setDeleteTarget(r)}>
                    <Trash2 className="h-3 w-3" /> Supprimer
                  </Button>
                </div>
              </div>
            );
          })}
          {paginated.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Aucune réservation trouvée.
            </div>
          )}
        </div>

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-xs text-muted-foreground">
              Affichage {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
            </p>
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
        <ReservationDialog
          reservation={editing}
          vehicles={vehicles}
          existingReservations={reservations}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {/* ─── Delete Dialog ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette réservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `La réservation de ${deleteTarget.clientName} du ${new Date(deleteTarget.startDate).toLocaleDateString("fr-FR")} sera supprimée.`}
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

function SummaryCard({ label, value, tint, icon: Icon }: { label: string; value: number; tint: string; icon: React.ElementType }) {
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

function ReservationDialog({
  reservation,
  vehicles,
  existingReservations,
  onClose,
  onSave,
}: {
  reservation: Reservation | null;
  vehicles: any[];
  existingReservations: Reservation[];
  onClose: () => void;
  onSave: (r: Omit<Reservation, "id" | "createdAt">, id?: string) => void;
}) {
  const [vehicleId, setVehicleId] = useState(reservation?.vehicleId ?? "");
  const [type, setType] = useState<ReservationType>(reservation?.type ?? "transfer");
  const [status, setStatus] = useState<ReservationStatus>(reservation?.status ?? "pending");
  const [startDate, setStartDate] = useState(reservation?.startDate ?? new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(reservation?.startTime ?? "09:00");
  const [endDate, setEndDate] = useState(reservation?.endDate ?? new Date().toISOString().split("T")[0]);
  const [endTime, setEndTime] = useState(reservation?.endTime ?? "10:00");
  const [pickupLocation, setPickupLocation] = useState(reservation?.pickupLocation ?? "");
  const [dropoffLocation, setDropoffLocation] = useState(reservation?.dropoffLocation ?? "");
  const [clientName, setClientName] = useState(reservation?.clientName ?? "");
  const [clientPhone, setClientPhone] = useState(reservation?.clientPhone ?? "");
  const [notes, setNotes] = useState(reservation?.notes ?? "");
  const [conflictWarning, setConflictWarning] = useState("");

  const checkConflict = (vId: string, sDate: string, sTime: string, eDate: string, eTime: string, excludeId?: string) => {
    const newStart = new Date(`${sDate}T${sTime}`).getTime();
    const newEnd = new Date(`${eDate}T${eTime}`).getTime();

    const conflicts = existingReservations.filter((r) => {
      if (r.id === excludeId) return false;
      if (r.vehicleId !== vId) return false;
      if (r.status === "cancelled") return false;

      const rStart = new Date(`${r.startDate}T${r.startTime}`).getTime();
      const rEnd = new Date(`${r.endDate}T${r.endTime}`).getTime();

      return newStart < rEnd && rStart < newEnd;
    });

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      setConflictWarning(
        `⚠️ Conflit détecté : ce véhicule est déjà réservé de ${conflict.startTime} à ${conflict.endTime} (${conflict.clientName})`
      );
    } else {
      setConflictWarning("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !startDate || !startTime || !endDate || !endTime || !pickupLocation || !dropoffLocation || !clientName) return;
    onSave(
      {
        vehicleId,
        type,
        status,
        startDate,
        startTime,
        endDate,
        endTime,
        pickupLocation,
        dropoffLocation,
        clientName,
        clientPhone,
        notes,
      },
      reservation?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{reservation ? "Modifier la réservation" : "Nouvelle réservation"}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Véhicule */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Véhicule *</label>
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                checkConflict(e.target.value, startDate, startTime, endDate, endTime, reservation?.id);
              }}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate}</option>
              ))}
            </select>
          </div>

          {/* Type & Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ReservationType)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="transfer">Transfert</option>
                <option value="airport">Aéroport</option>
                <option value="day_trip">Journée</option>
                <option value="multi_day">Plusieurs jours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReservationStatus)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Date début *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  checkConflict(vehicleId, e.target.value, startTime, endDate, endTime, reservation?.id);
                }}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Heure début *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  checkConflict(vehicleId, startDate, e.target.value, endDate, endTime, reservation?.id);
                }}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Date fin *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  checkConflict(vehicleId, startDate, startTime, e.target.value, endTime, reservation?.id);
                }}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Heure fin *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  checkConflict(vehicleId, startDate, startTime, endDate, e.target.value, reservation?.id);
                }}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Conflit */}
          {conflictWarning && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {conflictWarning}
            </div>
          )}

          {/* Trajet */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Lieu de prise en charge *</label>
            <input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required placeholder="Ex: Hôtel Carlton, Tunis" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Lieu de destination *</label>
            <input value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} required placeholder="Ex: Aéroport Tunis-Carthage" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {/* Client */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Client *</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="Nom du client" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Téléphone</label>
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+216 XX XXX XXX" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Vol, terminal, demandes spéciales..." className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted">Annuler</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">{reservation ? "Enregistrer" : "Réserver"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}