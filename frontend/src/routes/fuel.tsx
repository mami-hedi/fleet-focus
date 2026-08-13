import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus, Search, Fuel, Calendar, Gauge, Droplets,
  TrendingUp, Euro, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, X, Pencil, Trash2, AlertTriangle, Loader2
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
import { toast } from "sonner";
import { useFleetStore } from "@/lib/store";
import { ApiRequestError } from "@/lib/api-client";
import type { FuelEntryDTO, FuelInput } from "@/lib/fuelService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fuel")({
  head: () => ({ meta: [{ title: "Carburant — FleetOps" }] }),
  component: FuelPage,
});

const ITEMS_PER_PAGE = 10;

function FuelPage() {
  const entries = useFleetStore((s) => s.fuelEntries);
  const fuelLoaded = useFleetStore((s) => s.fuelLoaded);
  const fuelLoading = useFleetStore((s) => s.fuelLoading);
  const fuelError = useFleetStore((s) => s.fuelError);
  const fetchFuelEntries = useFleetStore((s) => s.fetchFuelEntries);
  const addFuelEntry = useFleetStore((s) => s.addFuelEntry);
  const editFuelEntry = useFleetStore((s) => s.editFuelEntry);
  const removeFuelEntry = useFleetStore((s) => s.removeFuelEntry);
  const vehicles = useFleetStore((s) => s.vehicles);
  const vehiclesLoaded = useFleetStore((s) => s.vehiclesLoaded);
  const fetchVehicles = useFleetStore((s) => s.fetchVehicles);

  const [query, setQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FuelEntryDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FuelEntryDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!fuelLoaded) fetchFuelEntries();
    // La page /fuel peut être ouverte directement (sans passer par /vehicles) :
    // on charge aussi la liste des véhicules, sinon le select du formulaire
    // (ajout ET modification) reste vide et n'affiche pas le véhicule pré-sélectionné.
    if (!vehiclesLoaded) fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Filtrage ───
  const filtered = entries.filter((e) => {
    const matchVehicle = vehicleFilter === "all" || e.vehicleId === vehicleFilter;
    if (!query) return matchVehicle;
    const q = query.toLowerCase();
    const v = vehicles.find((x) => x.id === e.vehicleId);
    return (
      matchVehicle &&
      (e.station.toLowerCase().includes(q) ||
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
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeFuelEntry(deleteTarget.id);
      toast.success("Plein supprimé");
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.detail : (err as Error).message;
      toast.error(message || "Erreur lors de la suppression du plein");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Stats ───
  const totalLiters = entries.reduce((s, e) => s + e.liters, 0);
  const totalCost = entries.reduce((s, e) => s + e.totalCost, 0);
  const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  // Consommation par véhicule
  const consumptionByVehicle = vehicles.map((v) => {
    const vEntries = entries.filter((e) => e.vehicleId === v.id).sort((a, b) => a.mileage - b.mileage);
    let consumption: number | null = null;
    if (vEntries.length >= 2) {
      const last = vEntries[vEntries.length - 1];
      const prev = vEntries[vEntries.length - 2];
      const km = last.mileage - prev.mileage;
      const liters = vEntries.slice(1).reduce((s, e) => s + e.liters, 0);
      consumption = km > 0 ? (liters / km) * 100 : null;
    }
    return { ...v, consumption };
  }).filter((v) => v.consumption !== null);

  return (
    <AppLayout
      title="Carburant"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau plein</span>
          <span className="sm:hidden">Plein</span>
        </Button>
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">

        {/* ─── Cartes stats ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Total litres" value={`${totalLiters.toFixed(1)} L`} tint="bg-info/10 text-info" icon={Droplets} />
          <SummaryCard label="Coût total" value={`${totalCost.toFixed(2)} €`} tint="bg-muted text-foreground" icon={Euro} />
          <SummaryCard label="Prix moyen" value={`${avgPrice.toFixed(3)} €/L`} tint="bg-warning/15 text-warning-foreground" icon={TrendingUp} />
          <SummaryCard label="Pleins" value={entries.length} tint="bg-success/10 text-success" icon={Fuel} />
        </div>

        {/* ─── Erreur de chargement ─── */}
        {fuelError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{fuelError}</span>
            <button onClick={() => fetchFuelEntries()} className="ml-auto underline underline-offset-2">
              Réessayer
            </button>
          </div>
        )}

        {/* ─── Consommation par véhicule ─── */}
        {consumptionByVehicle.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              Consommation moyenne (L/100km)
            </h3>
            <div className="space-y-2">
              {consumptionByVehicle.map((v) => (
                <div key={v.id} className="flex items-center gap-3">
                  <img src={v.image} alt="" className="h-8 w-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.brand} {v.model}</p>
                    <p className="text-xs text-muted-foreground">{v.plate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 sm:w-32 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          (v.consumption ?? 0) < 6 ? "bg-success" :
                          (v.consumption ?? 0) < 9 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${Math.min((v.consumption ?? 0) / 12 * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-14 text-right">{v.consumption?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Filtres ─── */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher une station..."
              className="pl-9"
            />
          </div>
          <select
            value={vehicleFilter}
            onChange={(e) => { setVehicleFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tous véhicules</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.brand} {v.model}</option>
            ))}
          </select>
        </div>

        {/* ─── État de chargement ─── */}
        {fuelLoading && entries.length === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des pleins…
          </div>
        ) : (
          <>
            {/* ─── Tableau Desktop ─── */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Litres</TableHead>
                    <TableHead>Prix/L</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Kilométrage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((e) => {
                    const v = vehicles.find((x) => x.id === e.vehicleId);
                    return (
                      <TableRow key={e.id}>
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
                            {new Date(e.date).toLocaleDateString("fr-FR")}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{e.station}</TableCell>
                        <TableCell className="text-sm">{e.liters.toFixed(1)} L</TableCell>
                        <TableCell className="text-sm">{e.pricePerLiter.toFixed(3)} €</TableCell>
                        <TableCell className="text-sm font-medium">{e.totalCost.toFixed(2)} €</TableCell>
                        <TableCell className="text-sm">{e.mileage.toLocaleString("fr-FR")} km</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(e); setDialogOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(e)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        Aucun plein trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ─── Cartes Mobile ─── */}
            <div className="sm:hidden space-y-3">
              {paginated.map((e) => {
                const v = vehicles.find((x) => x.id === e.vehicleId);
                return (
                  <div key={e.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
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
                      <span className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        e.fullTank ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {e.fullTank ? "Plein" : "Partiel"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Date</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(e.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Station</p>
                        <p>{e.station}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Carburant</p>
                        <p className="flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-muted-foreground" />
                          {e.liters.toFixed(1)} L
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Prix/L</p>
                        <p>{e.pricePerLiter.toFixed(3)} €</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Total</p>
                        <p className="font-medium">{e.totalCost.toFixed(2)} €</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Kilométrage</p>
                        <p className="flex items-center gap-1">
                          <Gauge className="h-3 w-3 text-muted-foreground" />
                          {e.mileage.toLocaleString("fr-FR")} km
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setEditing(e); setDialogOpen(true); }}>
                        <Pencil className="h-3 w-3" /> Modifier
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => setDeleteTarget(e)}>
                        <Trash2 className="h-3 w-3" /> Supprimer
                      </Button>
                    </div>
                  </div>
                );
              })}
              {paginated.length === 0 && (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  Aucun plein trouvé.
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
          </>
        )}
      </div>

      {/* ─── Dialog ─── */}
      {dialogOpen && (
        <FuelDialog
          entry={editing}
          vehicles={vehicles}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          onSubmit={(input) =>
            editing ? editFuelEntry(editing.id, input) : addFuelEntry(input)
          }
        />
      )}

      {/* ─── Delete Dialog ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce plein ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `Le plein du ${new Date(deleteTarget.date).toLocaleDateString("fr-FR")} chez ${deleteTarget.station} sera supprimé.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
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

function FuelDialog({
  entry,
  vehicles,
  onClose,
  onSubmit,
}: {
  entry: FuelEntryDTO | null;
  vehicles: any[];
  onClose: () => void;
  onSubmit: (input: FuelInput) => Promise<unknown>;
}) {
  const [vehicleId, setVehicleId] = useState(entry?.vehicleId ?? "");
  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().split("T")[0]);
  const [station, setStation] = useState(entry?.station ?? "");
  const [liters, setLiters] = useState(entry?.liters?.toString() ?? "");
  const [pricePerLiter, setPricePerLiter] = useState(entry?.pricePerLiter?.toString() ?? "");
  const [mileage, setMileage] = useState(entry?.mileage?.toString() ?? "");
  const [fullTank, setFullTank] = useState(entry?.fullTank ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPreview = liters && pricePerLiter
    ? (parseFloat(liters) * parseFloat(pricePerLiter)).toFixed(2)
    : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !date || !station || !liters || !pricePerLiter || !mileage) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        vehicleId,
        date,
        station,
        liters: parseFloat(liters),
        pricePerLiter: parseFloat(pricePerLiter),
        mileage: parseInt(mileage),
        fullTank,
      });
      toast.success(entry ? "Plein mis à jour" : "Plein enregistré");
      onClose();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.detail : (err as Error).message;
      setError(message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{entry ? "Modifier le plein" : "Nouveau plein"}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Véhicule *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Station *</label>
              <input value={station} onChange={(e) => setStation(e.target.value)} required placeholder="Ex: Total" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Litres *</label>
              <input type="number" step="0.1" value={liters} onChange={(e) => setLiters(e.target.value)} required placeholder="45.5" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Prix/L (€) *</label>
              <input type="number" step="0.001" value={pricePerLiter} onChange={(e) => setPricePerLiter(e.target.value)} required placeholder="2.15" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Kilométrage *</label>
            <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} required placeholder="45230" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-input bg-background p-3">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Plein complet</span>
            </div>
            <button
              type="button"
              onClick={() => setFullTank(!fullTank)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                fullTank ? "bg-primary" : "bg-muted"
              )}
            >
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", fullTank ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Total estimé</p>
            <p className="text-lg font-semibold">{totalPreview} €</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {entry ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}