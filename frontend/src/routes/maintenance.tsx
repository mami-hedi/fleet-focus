import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Calendar, Wrench, Euro, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFleetStore } from "@/lib/store";
import { MaintenanceDialog } from "@/components/MaintenanceDialog";
import { cn } from "@/lib/utils";

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
  const vehicles = useFleetStore((s) => s.vehicles);
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Planifier</span>
          <span className="sm:hidden">Planifier</span>
        </Button>
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Aucune maintenance dans cette catégorie.
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((m) => (
                <MaintenanceRow key={m.id} maintenance={m} vehicles={vehicles} />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ═══════════════════ CARTES MOBILE ═══════════════════ */}
        <div className="sm:hidden space-y-3">
          {paginated.map((m) => (
            <MaintenanceCard key={m.id} maintenance={m} vehicles={vehicles} />
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
      </div>

      <MaintenanceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ═══════════════════════════════════════════════════════════════ */

function MaintenanceRow({ maintenance: m, vehicles }: { maintenance: any; vehicles: any[] }) {
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
    </TableRow>
  );
}

function MaintenanceCard({ maintenance: m, vehicles }: { maintenance: any; vehicles: any[] }) {
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