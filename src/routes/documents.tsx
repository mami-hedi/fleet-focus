import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle, Plus, X, Upload, Filter, Calendar, FileText, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { docTypeLabels, daysUntil } from "@/lib/mock-data";
import { useFleetStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documents & conformité — FleetOps" }] }),
  component: DocumentsPage,
});

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

const ITEMS_PER_PAGE = 10;

function DocumentsPage() {
  const documents = useFleetStore((s) => s.documents);
  const vehicles = useFleetStore((s) => s.vehicles);
  const addDocument = useFleetStore((s) => s.addDocument);

  // ─── Filtres ───
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [dateMode, setDateMode] = useState<"month" | "exact">("month");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // ─── Pagination ───
  const [currentPage, setCurrentPage] = useState(1);

  const [isOpen, setIsOpen] = useState(false);

  // ─── Documents triés et filtrés ───
  const sorted = [...documents].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  const filtered = sorted.filter((d) => {
    const days = daysUntil(d.expiryDate);
    const urgency = days < 0 ? "expired" : days < 30 ? "soon" : "ok";

    const matchType = !filterType || d.type === filterType;
    const matchStatus = !filterStatus || urgency === filterStatus;

    let matchDate = true;
    if (dateMode === "month" && filterMonth) {
      matchDate = d.expiryDate.split("-")[1] === filterMonth;
    } else if (dateMode === "exact" && filterDate) {
      matchDate = d.expiryDate === filterDate;
    }

    return matchType && matchStatus && matchDate;
  });

  // ─── Pagination calcul ───
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Reset page quand filtres changent
  const applyFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const expired = sorted.filter((d) => daysUntil(d.expiryDate) < 0).length;
  const soon = sorted.filter((d) => { const dd = daysUntil(d.expiryDate); return dd >= 0 && dd < 30; }).length;

  const hasFilters = filterType || filterStatus || filterMonth || filterDate;

  const clearFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setFilterMonth("");
    setFilterDate("");
    setCurrentPage(1);
  };

  // ─── Pagination helpers ───
  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  // Show max 5 page numbers with ellipsis
  const getVisiblePages = () => {
    if (totalPages <= 5) return pageNumbers;
    if (safePage <= 3) return [...pageNumbers.slice(0, 5), "...", totalPages];
    if (safePage >= totalPages - 2) return [1, "...", ...pageNumbers.slice(totalPages - 5)];
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  };

  return (
    <AppLayout title="Documents & conformité">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">

        {/* ═══════════════════ HEADER : Cartes + Bouton ═══════════════════ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
            <Card label="Suivis" value={documents.length} tint="bg-muted text-foreground" />
            <Card label="< 30 j" value={soon} tint="bg-warning/20 text-warning-foreground" />
            <Card label="Expirés" value={expired} tint="bg-destructive/10 text-destructive" />
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto w-full"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter un document</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>

        {/* ═══════════════════ BARRE DE FILTRES ═══════════════════ */}
        {/* Desktop : inline */}
        <div className="hidden sm:flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
          </div>

          <FilterType value={filterType} onChange={applyFilter(setFilterType)} />
          <FilterDate
            mode={dateMode}
            month={filterMonth}
            exact={filterDate}
            onModeChange={setDateMode}
            onMonthChange={applyFilter(setFilterMonth)}
            onExactChange={applyFilter(setFilterDate)}
          />
          <FilterStatus value={filterStatus} onChange={applyFilter(setFilterStatus)} />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="h-3 w-3" />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Mobile : toggle + drawer */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres {hasFilters && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">Actifs</span>}
            </span>
            <span className="text-muted-foreground">{showFiltersMobile ? "▲" : "▼"}</span>
          </button>

          {showFiltersMobile && (
            <div className="mt-2 space-y-3 rounded-xl border border-border bg-card p-4">
              <FilterType value={filterType} onChange={applyFilter(setFilterType)} mobile />
              <FilterDate
                mode={dateMode}
                month={filterMonth}
                exact={filterDate}
                onModeChange={setDateMode}
                onMonthChange={applyFilter(setFilterMonth)}
                onExactChange={applyFilter(setFilterDate)}
                mobile
              />
              <FilterStatus value={filterStatus} onChange={applyFilter(setFilterStatus)} mobile />

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════ TABLEAU DESKTOP ═══════════════════ */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Véhicule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((d) => <DocRow key={d.id} doc={d} vehicles={vehicles} />)}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    Aucun document ne correspond aux filtres sélectionnés.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ═══════════════════ CARTES MOBILE ═══════════════════ */}
        <div className="sm:hidden space-y-3">
          {paginated.map((d) => <DocCard key={d.id} doc={d} vehicles={vehicles} />)}
          {paginated.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Aucun document ne correspond aux filtres sélectionnés.
            </div>
          )}
        </div>

        {/* ═══════════════════ PAGINATION ═══════════════════ */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 py-2">
            {/* Info */}
            <p className="text-xs text-muted-foreground">
              Affichage {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
            </p>

            {/* Desktop pagination */}
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

            {/* Mobile pagination : simple prev/next */}
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

      {/* Modal d'ajout */}
      {isOpen && <AddDocumentModal onClose={() => setIsOpen(false)} vehicles={vehicles} onAdd={addDocument} />}
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ═══════════════════════════════════════════════════════════════ */

function Card({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
      <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 sm:mt-2 flex items-center gap-2 sm:gap-3">
        <span className="text-xl sm:text-2xl font-semibold">{value}</span>
        <span className={cn("rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium", tint)}>docs</span>
      </div>
    </div>
  );
}

function FilterType({ value, onChange, mobile }: { value: string; onChange: (v: string) => void; mobile?: boolean }) {
  return (
    <div className={cn("relative", mobile && "w-full")}>
      <FileText className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 appearance-none rounded-lg border border-input bg-background pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
          mobile && "w-full"
        )}
      >
        <option value="">Tous les types</option>
        {Object.entries(docTypeLabels).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>
  );
}

function FilterStatus({ value, onChange, mobile }: { value: string; onChange: (v: string) => void; mobile?: boolean }) {
  return (
    <div className={cn("relative", mobile && "w-full")}>
      <ShieldCheck className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 appearance-none rounded-lg border border-input bg-background pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
          mobile && "w-full"
        )}
      >
        <option value="">Tous les statuts</option>
        <option value="ok">Valide</option>
        <option value="soon">Expire bientôt</option>
        <option value="expired">Expiré</option>
      </select>
    </div>
  );
}

function FilterDate({
  mode, month, exact,
  onModeChange, onMonthChange, onExactChange,
  mobile
}: {
  mode: "month" | "exact";
  month: string;
  exact: string;
  onModeChange: (m: "month" | "exact") => void;
  onMonthChange: (v: string) => void;
  onExactChange: (v: string) => void;
  mobile?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", mobile && "flex-col w-full")}>
      <div className={cn("relative", mobile && "w-full")}>
        <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        {mode === "month" ? (
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className={cn(
              "h-9 appearance-none rounded-lg border border-input bg-background pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
              mobile && "w-full"
            )}
          >
            <option value="">Tous les mois</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        ) : (
          <input
            type="date"
            value={exact}
            onChange={(e) => onExactChange(e.target.value)}
            className={cn(
              "h-9 rounded-lg border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
              mobile && "w-full"
            )}
          />
        )}
      </div>

      <div className={cn("flex rounded-lg border border-input bg-background p-0.5", mobile && "w-full")}>
        <button
          type="button"
          onClick={() => { onModeChange("month"); onExactChange(""); }}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors flex-1",
            mode === "month"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Mois
        </button>
        <button
          type="button"
          onClick={() => { onModeChange("exact"); onMonthChange(""); }}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors flex-1",
            mode === "exact"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Exacte
        </button>
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

function DocRow({ doc, vehicles }: { doc: any; vehicles: any[] }) {
  const v = vehicles.find((x) => x.id === doc.vehicleId);
  const days = daysUntil(doc.expiryDate);
  const urgency = days < 0 ? "expired" : days < 30 ? "soon" : "ok";
  const cfg = {
    expired: { cls: "bg-destructive/10 text-destructive border-destructive/30", label: `Expiré depuis ${Math.abs(days)} j` },
    soon: { cls: "bg-warning/15 text-warning-foreground border-warning/30", label: `Expire dans ${days} j` },
    ok: { cls: "bg-success/10 text-success border-success/20", label: "Valide" },
  }[urgency];

  return (
    <TableRow className={urgency !== "ok" ? "bg-muted/30" : undefined}>
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
      <TableCell className="text-sm">{docTypeLabels[doc.type]}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{doc.number}</TableCell>
      <TableCell className="text-sm">
        {new Date(doc.expiryDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}
      </TableCell>
      <TableCell>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cfg.cls)}>
          {urgency !== "ok" && <AlertTriangle className="h-3 w-3" />}
          {cfg.label}
        </span>
      </TableCell>
    </TableRow>
  );
}

function DocCard({ doc, vehicles }: { doc: any; vehicles: any[] }) {
  const v = vehicles.find((x) => x.id === doc.vehicleId);
  const days = daysUntil(doc.expiryDate);
  const urgency = days < 0 ? "expired" : days < 30 ? "soon" : "ok";
  const cfg = {
    expired: { cls: "bg-destructive/10 text-destructive border-destructive/30", label: `Expiré depuis ${Math.abs(days)} j` },
    soon: { cls: "bg-warning/15 text-warning-foreground border-warning/30", label: `Expire dans ${days} j` },
    ok: { cls: "bg-success/10 text-success border-success/20", label: "Valide" },
  }[urgency];

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
        <span className={cn("shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", cfg.cls)}>
          {urgency !== "ok" && <AlertTriangle className="h-3 w-3" />}
          {cfg.label}
        </span>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Type</p>
          <p>{docTypeLabels[doc.type]}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Numéro</p>
          <p className="font-mono text-xs">{doc.number}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] uppercase text-muted-foreground">Expiration</p>
          <p>{new Date(doc.expiryDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL D'AJOUT
   ═══════════════════════════════════════════════════════════════ */

function AddDocumentModal({ onClose, vehicles, onAdd }: { onClose: () => void; vehicles: any[]; onAdd: (doc: any) => void }) {
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("");
  const [number, setNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
        setPhotoName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !type || !number || !expiryDate) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      vehicleId,
      type,
      number,
      expiryDate,
      photo,
      photoName,
    };

    onAdd(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Ajouter un document</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Véhicule</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} — {v.plate}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Type de document</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sélectionner un type</option>
              {Object.entries(docTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Numéro du document</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              placeholder="Ex: CT-2024-001"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Date d'expiration</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Photo du document</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              className={cn(
                "relative rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : photo
                  ? "border-success bg-success/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {photo ? (
                <div className="space-y-2">
                  <img src={photo} alt="Aperçu" className="mx-auto h-32 rounded-lg object-cover shadow-sm" />
                  <p className="text-xs text-muted-foreground">{photoName}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhoto(null);
                      setPhotoName("");
                    }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Supprimer la photo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Glisser-déposer ou cliquer pour importer</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, JPEG jusqu'à 5 Mo</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}