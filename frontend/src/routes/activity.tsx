import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search, Calendar, Car, Wrench, FileText, ClipboardCheck,
  UserPlus, Pencil, Trash2, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock, Filter, X
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFleetStore } from "@/lib/store";
import { type ActivityKind } from "@/lib/activityservice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Journal d'activité — FleetOps" }] }),
  component: ActivityPage,
});

const ITEMS_PER_PAGE = 15;

// ─── Ligne d'activité normalisée (fusion historique optimiste local + backend) ───
interface ActivityRow {
  id: string;
  timestamp: string;
  kind: ActivityKind;
  label: string;
  details?: string | null;
  vehicleId?: string | null;
  user: string;
}

// ─── Configuration des icônes et couleurs ───
const kindConfig: Record<ActivityKind, { icon: React.ElementType; label: string; cls: string }> = {
  vehicle_created: { icon: Car, label: "Véhicule", cls: "bg-success/10 text-success border-success/20" },
  vehicle_updated: { icon: Pencil, label: "Modification", cls: "bg-info/10 text-info border-info/20" },
  vehicle_deleted: { icon: Trash2, label: "Suppression", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  maintenance_scheduled: { icon: Wrench, label: "Maintenance", cls: "bg-warning/15 text-warning-foreground border-warning/30" },
  inspection_created: { icon: ClipboardCheck, label: "État des lieux", cls: "bg-primary/10 text-primary border-primary/20" },
  document_created: { icon: FileText, label: "Document", cls: "bg-info/10 text-info border-info/20" },
  driver_created: { icon: UserPlus, label: "Conducteur", cls: "bg-success/10 text-success border-success/20" },
  driver_updated: { icon: Pencil, label: "Conducteur", cls: "bg-info/10 text-info border-info/20" },
  incident_created: { icon: AlertTriangle, label: "Incident", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  fuel_added: { icon: CheckCircle2, label: "Carburant", cls: "bg-success/10 text-success border-success/20" },
  reservation_created: { icon: Calendar, label: "Réservation", cls: "bg-primary/10 text-primary border-primary/20" },
  reservation_updated: { icon: Pencil, label: "Réservation", cls: "bg-info/10 text-info border-info/20" },
};

function ActivityPage() {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<ActivityKind | "all">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const vehicles = useFleetStore((s) => s.vehicles);
  const storeActivities = useFleetStore((s) => s.activities);
  const activitiesLoading = useFleetStore((s) => s.activitiesLoading);
  const activitiesError = useFleetStore((s) => s.activitiesError);
  const fetchActivities = useFleetStore((s) => s.fetchActivities);

  // Toujours rafraîchir le journal à chaque visite de la page pour avoir
  // les dernières actions (y compris celles faites depuis d'autres onglets).
  useEffect(() => {
    fetchActivities();
  }, []);

  // Le backend est la source de vérité unique : on n'utilise plus les entrées
  // optimistes locales (storeHistory) qui avaient des IDs temporaires ne
  // correspondant jamais aux IDs réels en BDD → suppression des doublons.
  const allActivities: ActivityRow[] = storeActivities
    .map((a) => ({
      id: a.id,
      timestamp: a.timestamp,
      kind: a.kind,
      label: a.label,
      details: a.details,
      vehicleId: a.vehicleId,
      user: a.User?.name ?? "Système",
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // ─── Filtrage ───
  const filtered = allActivities.filter((a) => {
    const matchKind = kindFilter === "all" || a.kind === kindFilter;
    const matchDate = !dateFilter || a.timestamp.startsWith(dateFilter);
    if (!query) return matchKind && matchDate;
    const q = query.toLowerCase();
    return (
      matchKind &&
      matchDate &&
      (a.label.toLowerCase().includes(q) ||
        a.details?.toLowerCase().includes(q) ||
        a.user.toLowerCase().includes(q))
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

  const hasFilters = query || kindFilter !== "all" || dateFilter;

  const clearFilters = () => {
    setQuery("");
    setKindFilter("all");
    setDateFilter("");
    setCurrentPage(1);
  };

  // ─── Stats ───
  const today = new Date().toISOString().split("T")[0];
  const todayCount = allActivities.filter((a) => a.timestamp.startsWith(today)).length;
  const weekCount = allActivities.filter((a) => {
    const d = new Date(a.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  return (
    <AppLayout title="Journal d'activité">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">

        {/* ─── Cartes stats ─── */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Aujourd'hui" value={todayCount} tint="bg-primary/10 text-primary" icon={Clock} />
          <SummaryCard label="7 derniers jours" value={weekCount} tint="bg-info/10 text-info" icon={Calendar} />
          <SummaryCard label="Total" value={allActivities.length} tint="bg-muted text-foreground" icon={CheckCircle2} />
        </div>

        {activitiesError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            Impossible de charger l'historique complet ({activitiesError}). Les actions récentes restent visibles.
          </div>
        )}

        {/* ─── Filtres ─── */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Rechercher dans l'historique..."
                className="pl-9"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={kindFilter}
                onChange={(e) => { setKindFilter(e.target.value as ActivityKind | "all"); setCurrentPage(1); }}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">Tous types</option>
                <option value="vehicle_created">Véhicule créé</option>
                <option value="vehicle_updated">Véhicule modifié</option>
                <option value="vehicle_deleted">Véhicule supprimé</option>
                <option value="maintenance_scheduled">Maintenance</option>
                <option value="inspection_created">État des lieux</option>
                <option value="document_created">Document</option>
                <option value="driver_created">Conducteur</option>
                <option value="incident_created">Incident</option>
                <option value="fuel_added">Carburant</option>
                <option value="reservation_created">Réservation créée</option>
                <option value="reservation_updated">Réservation modifiée</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Timeline Desktop ─── */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((a) => {
                const cfg = kindConfig[a.kind];
                const Icon = cfg.icon;
                const v = a.vehicleId ? vehicles.find((x) => x.id === a.vehicleId) : null;
                const date = new Date(a.timestamp);

                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", cfg.cls)}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{a.label}</p>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.cls)}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                      {a.details}
                    </TableCell>
                    <TableCell>
                      {v && (
                        <Link to="/vehicles/$id" params={{ id: v.id }} className="flex items-center gap-2">
                          <img src={v.image} alt="" className="h-6 w-10 rounded object-cover" />
                          <span className="text-sm">{v.plate}</span>
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{date.toLocaleDateString("fr-FR")}</p>
                        <p className="text-xs text-muted-foreground">{date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {a.user}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    {activitiesLoading ? "Chargement de l'historique..." : "Aucune activité trouvée."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── Timeline Mobile ─── */}
        <div className="sm:hidden space-y-3">
          {paginated.map((a) => {
            const cfg = kindConfig[a.kind];
            const Icon = cfg.icon;
            const v = a.vehicleId ? vehicles.find((x) => x.id === a.vehicleId) : null;
            const date = new Date(a.timestamp);

            return (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", cfg.cls)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{a.label}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.cls)}>
                        {cfg.label}
                      </span>
                    </div>
                    {a.details && (
                      <p className="text-sm text-muted-foreground">{a.details}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {v && (
                      <Link to="/vehicles/$id" params={{ id: v.id }} className="flex items-center gap-1.5">
                        <Car className="h-3 w-3" />
                        {v.plate}
                      </Link>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {date.toLocaleDateString("fr-FR")} à {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {a.user}
                  </span>
                </div>
              </div>
            );
          })}
          {paginated.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {activitiesLoading ? "Chargement de l'historique..." : "Aucune activité trouvée."}
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