import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Calendar,
  Wrench,
  Euro,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFleetStore } from "@/lib/store";
import { MaintenanceDialog } from "@/components/MaintenanceDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MaintenanceDTO } from "@/lib/maintenanceService";

type Filter = "all" | "upcoming" | "in_progress" | "completed";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — FleetOps" }] }),
  component: MaintenancePage,
});

const filterLabels: Record<Filter, string> = {
  all: "Toutes",
  upcoming: "À venir",
  in_progress: "En cours",
  completed: "Terminées",
};

const ITEMS_PER_PAGE = 10;

function MaintenancePage() {
  const maintenances = useFleetStore((s) => s.maintenances);
  const maintenancesLoading = useFleetStore((s) => s.maintenancesLoading);
  const maintenancesError = useFleetStore((s) => s.maintenancesError);
  const fetchMaintenances = useFleetStore((s) => s.fetchMaintenances);
  const removeMaintenance = useFleetStore((s) => s.removeMaintenance);
  const vehicles = useFleetStore((s) => s.vehicles);
  const [filter, setFilter] = useState<Filter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Dialog création / édition (même composant, distingué par `editingMaintenance`) ───
  const [createOpen, setCreateOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceDTO | null>(null);
  const isFormOpen = createOpen || editingMaintenance !== null;

  const handleFormOpenChange = (open: boolean) => {
    if (!open) {
      setCreateOpen(false);
      setEditingMaintenance(null);
    }
  };

  // ─── Confirmation de suppression ───
  const [deletingMaintenance, setDeletingMaintenance] = useState<MaintenanceDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingMaintenance) return;
    setIsDeleting(true);
    try {
      await removeMaintenance(deletingMaintenance.id);
      toast.success("Maintenance supprimée");
      setDeletingMaintenance(null);
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la suppression de la maintenance.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
  }, [fetchMaintenances]);

  const filtered = useMemo(
    () => (filter === "all" ? maintenances : maintenances.filter((m) => m.status === filter)),
    [maintenances, filter],
  );

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

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    setCurrentPage(1);
  };

  return (
    <AppLayout
      title="Maintenance"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Planifier</span>
          <span className="sm:hidden">Planifier</span>
        </Button>
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">

        {/* Erreur de chargement */}
        {maintenancesError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{maintenancesError}</span>
            <button onClick={() => fetchMaintenances()} className="ml-auto underline underline-offset-2">
              Réessayer
            </button>
          </div>
        )}

        {/* ═══════════════════ FILTRES ═══════════════════ */}
        {/* Desktop : tabs inline */}
        <div className="hidden sm:flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1 w-fit">
          {(Object.keys(filterLabels) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filterLabels[f]}
              <span className="ml-1.5 text-[10px] opacity-70">
                {f === "all" ? maintenances.length : maintenances.filter((m) => m.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Mobile : scroll horizontal */}
        <div className="sm:hidden flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {(Object.keys(filterLabels) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {filterLabels[f]}
              <span className="ml-1.5 text-[10px] opacity-70">
                {f === "all" ? maintenances.length : maintenances.filter((m) => m.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* ═══════════════════ ÉTAT DE CHARGEMENT ═══════════════════ */}
        {maintenancesLoading && maintenances.length === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des maintenances…
          </div>
        ) : (
          <>
            {/* ═══════════════════ TABLEAU DESKTOP ═══════════════════ */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Type d'intervention</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Garage</TableHead>
                    <TableHead>Coût</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        Aucune maintenance dans cette catégorie.
                      </TableCell>
                    </TableRow>
                  )}
                  {paginated.map((m) => (
                    <MaintenanceRow
                      key={m.id}
                      maintenance={m}
                      vehicles={vehicles}
                      onEdit={() => setEditingMaintenance(m)}
                      onDelete={() => setDeletingMaintenance(m)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ═══════════════════ CARTES MOBILE ═══════════════════ */}
            <div className="sm:hidden space-y-3">
              {paginated.map((m) => (
                <MaintenanceCard
                  key={m.id}
                  maintenance={m}
                  vehicles={vehicles}
                  onEdit={() => setEditingMaintenance(m)}
                  onDelete={() => setDeletingMaintenance(m)}
                />
              ))}
              {paginated.length === 0 && (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  Aucune maintenance dans cette catégorie.
                </div>
              )}
            </div>

            {/* ═══════════════════ PAGINATION ═══════════════════ */}
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
                          safePage === p
                            ? "bg-primary text-primary-foreground"
                            : "border border-input bg-background text-foreground hover:bg-muted"
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
          </>
        )}
      </div>

      <MaintenanceDialog open={isFormOpen} onOpenChange={handleFormOpenChange} maintenance={editingMaintenance} />

      <DeleteMaintenanceDialog
        maintenance={deletingMaintenance}
        isDeleting={isDeleting}
        onCancel={() => setDeletingMaintenance(null)}
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ═══════════════════════════════════════════════════════════════ */

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

function RowActions({ onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onEdit}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Modifier"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Supprimer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MaintenanceRow({
  maintenance: m,
  vehicles,
  onEdit,
  onDelete,
}: {
  maintenance: MaintenanceDTO;
  vehicles: any[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const v = vehicles.find((x) => x.id === m.vehicleId);
  const status = {
    upcoming: { label: "À venir", cls: "bg-info/15 text-info" },
    in_progress: { label: "En cours", cls: "bg-warning/20 text-warning-foreground" },
    completed: { label: "Terminée", cls: "bg-success/15 text-success" },
  }[m.status];

  return (
    <TableRow>
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
      <TableCell>{m.type}</TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1.5 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {new Date(m.completedDate ?? m.scheduledDate).toLocaleDateString("fr-FR")}
        </span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{m.garage}</TableCell>
      <TableCell className="text-sm">{m.cost ? `${m.cost} €` : "—"}</TableCell>
      <TableCell>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.cls)}>
          {status.label}
        </span>
      </TableCell>
      <TableCell>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}

function MaintenanceCard({
  maintenance: m,
  vehicles,
  onEdit,
  onDelete,
}: {
  maintenance: MaintenanceDTO;
  vehicles: any[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const v = vehicles.find((x) => x.id === m.vehicleId);
  const status = {
    upcoming: { label: "À venir", cls: "bg-info/15 text-info border-info/30" },
    in_progress: { label: "En cours", cls: "bg-warning/20 text-warning-foreground border-warning/30" },
    completed: { label: "Terminée", cls: "bg-success/15 text-success border-success/30" },
  }[m.status];

  const date = new Date(m.completedDate ?? m.scheduledDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header : véhicule + statut */}
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
        <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium", status.cls)}>
          {status.label}
        </span>
      </div>

      {/* Détails en grille */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <Wrench className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Intervention</p>
            <p>{m.type}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Date</p>
            <p>{date}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Garage</p>
            <p className="text-muted-foreground">{m.garage}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Euro className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Coût</p>
            <p>{m.cost ? `${m.cost} €` : "—"}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Modifier
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> Supprimer
        </Button>
      </div>
    </div>
  );
}

function DeleteMaintenanceDialog({
  maintenance,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  maintenance: MaintenanceDTO | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={maintenance !== null} onOpenChange={(o) => !o && !isDeleting && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer cette maintenance ?</DialogTitle>
          <DialogDescription>
            {maintenance?.type} — {maintenance?.garage}. Cette action est irréversible.
            {maintenance?.seriesId && (
              <span className="mt-2 block text-warning-foreground">
                Cette maintenance fait partie d'une série récurrente : seule cette occurrence sera supprimée, les autres restent planifiées.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting} className="gap-2">
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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