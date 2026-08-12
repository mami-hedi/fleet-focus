import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle, Plus, X, Upload, Filter, Calendar, FileText, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2,
  MoreVertical, Pencil, Trash2
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { docTypeLabels, daysUntil } from "@/lib/mock-data";
import { useFleetStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { DocumentDTO, DocumentInput } from "@/lib/documentService";

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

// Base publique de l'API, utilisée pour préfixer les fileUrl relatifs renvoyés par le backend.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const FILE_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// Défensif : d'anciens documents créés avant le fix upload (multer) peuvent avoir un
// base64 brut stocké dans fileUrl au lieu d'un chemin relatif — souvent tronqué par la
// colonne STRING (VARCHAR 255), ce qui casse l'URL. On n'affiche le lien que si fileUrl
// ressemble à un chemin/URL valide ; sinon on masque silencieusement plutôt que de générer
// un lien cassé.
function resolveFileUrl(fileUrl: string | null): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
  if (fileUrl.startsWith("data:")) return null; // legacy corrompu, probablement tronqué
  return `${FILE_ORIGIN}${fileUrl}`;
}

function DocumentsPage() {
  const documents = useFleetStore((s) => s.documents);
  const documentsLoading = useFleetStore((s) => s.documentsLoading);
  const documentsError = useFleetStore((s) => s.documentsError);
  const fetchDocuments = useFleetStore((s) => s.fetchDocuments);
  const addDocument = useFleetStore((s) => s.addDocument);
  const editDocument = useFleetStore((s) => s.editDocument);
  const removeDocument = useFleetStore((s) => s.removeDocument);
  const vehicles = useFleetStore((s) => s.vehicles);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ─── Filtres ───
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [dateMode, setDateMode] = useState<"month" | "exact">("month");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // ─── Pagination ───
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Modals ───
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentDTO | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentDTO | null>(null);

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

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const getVisiblePages = () => {
    if (totalPages <= 5) return pageNumbers;
    if (safePage <= 3) return [...pageNumbers.slice(0, 5), "...", totalPages];
    if (safePage >= totalPages - 2) return [1, "...", ...pageNumbers.slice(totalPages - 5)];
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    await removeDocument(deletingDoc.id);
    setDeletingDoc(null);
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
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto w-full"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter un document</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>

        {/* Erreur de chargement */}
        {documentsError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{documentsError}</span>
            <button onClick={() => fetchDocuments()} className="ml-auto underline underline-offset-2">
              Réessayer
            </button>
          </div>
        )}

        {/* ═══════════════════ BARRE DE FILTRES ═══════════════════ */}
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

        {/* ═══════════════════ ÉTAT DE CHARGEMENT ═══════════════════ */}
        {documentsLoading && documents.length === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des documents…
          </div>
        ) : (
          <>
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
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((d) => (
                    <DocRow
                      key={d.id}
                      doc={d}
                      vehicles={vehicles}
                      onEdit={() => setEditingDoc(d)}
                      onDelete={() => setDeletingDoc(d)}
                    />
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                        Aucun document ne correspond aux filtres sélectionnés.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ═══════════════════ CARTES MOBILE ═══════════════════ */}
            <div className="sm:hidden space-y-3">
              {paginated.map((d) => (
                <DocCard
                  key={d.id}
                  doc={d}
                  vehicles={vehicles}
                  onEdit={() => setEditingDoc(d)}
                  onDelete={() => setDeletingDoc(d)}
                />
              ))}
              {paginated.length === 0 && (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  Aucun document ne correspond aux filtres sélectionnés.
                </div>
              )}
            </div>

            {/* ═══════════════════ PAGINATION ═══════════════════ */}
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

      {isAddOpen && (
        <DocumentFormModal
          mode="create"
          onClose={() => setIsAddOpen(false)}
          vehicles={vehicles}
          onSubmit={(input) => addDocument(input)}
        />
      )}

      {editingDoc && (
        <DocumentFormModal
          mode="edit"
          initialDoc={editingDoc}
          onClose={() => setEditingDoc(null)}
          vehicles={vehicles}
          onSubmit={(input) => editDocument(editingDoc.id, input)}
        />
      )}

      {deletingDoc && (
        <DeleteConfirmDialog
          doc={deletingDoc}
          onCancel={() => setDeletingDoc(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
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

/* ─── Menu d'actions (Modifier / Supprimer) ─── */

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-block text-left"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

function DocRow({
  doc, vehicles, onEdit, onDelete,
}: {
  doc: DocumentDTO;
  vehicles: any[];
  onEdit: () => void;
  onDelete: () => void;
}) {
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
      <TableCell>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}

function DocCard({
  doc, vehicles, onEdit, onDelete,
}: {
  doc: DocumentDTO;
  vehicles: any[];
  onEdit: () => void;
  onDelete: () => void;
}) {
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
        <div className="flex shrink-0 items-center gap-1">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", cfg.cls)}>
            {urgency !== "ok" && <AlertTriangle className="h-3 w-3" />}
            {cfg.label}
          </span>
          <RowActions onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

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
        {resolveFileUrl(doc.fileUrl) && (
          <div className="col-span-2">
            <a
              href={resolveFileUrl(doc.fileUrl)!}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary underline underline-offset-2"
            >
              Voir la photo du document
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL D'AJOUT / MODIFICATION (formulaire partagé)
   ═══════════════════════════════════════════════════════════════ */

function DocumentFormModal({
  mode, initialDoc, onClose, vehicles, onSubmit,
}: {
  mode: "create" | "edit";
  initialDoc?: DocumentDTO;
  onClose: () => void;
  vehicles: any[];
  onSubmit: (input: DocumentInput) => Promise<unknown>;
}) {
  const [vehicleId, setVehicleId] = useState(initialDoc?.vehicleId ?? "");
  const [type, setType] = useState(initialDoc?.type ?? "");
  const [number, setNumber] = useState(initialDoc?.number ?? "");
  const [expiryDate, setExpiryDate] = useState(initialDoc?.expiryDate ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  // En édition, on affiche la photo existante tant que l'utilisateur n'en choisit pas une nouvelle.
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialDoc?.fileUrl ? resolveFileUrl(initialDoc.fileUrl) : null
  );
  const [photoName, setPhotoName] = useState<string | null>(
    resolveFileUrl(initialDoc?.fileUrl ?? null) ? "Photo actuelle" : null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === "edit";

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La photo dépasse la taille maximale de 5 Mo.");
      return;
    }
    setError(null);
    setPhotoFile(file); // fichier réel envoyé au backend
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string); // aperçu local uniquement
      setPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !type || !number || !expiryDate) return;

    setIsSubmitting(true);
    setError(null);
    try {
      // photo: null si aucune nouvelle photo choisie -> le backend garde le fileUrl existant en édition
      await onSubmit({ vehicleId, type, number, expiryDate, photo: photoFile });
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Modifier le document" : "Ajouter un document"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          >
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
            <label className="block text-sm font-medium mb-1.5">
              Photo du document {isEdit && <span className="text-muted-foreground font-normal">(laisser vide pour conserver l'actuelle)</span>}
            </label>
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
                  : photoPreview
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
              {photoPreview ? (
                <div className="space-y-2">
                  <img src={photoPreview} alt="Aperçu" className="mx-auto h-32 rounded-lg object-cover shadow-sm" />
                  <p className="text-xs text-muted-foreground">{photoName}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      setPhotoName(null);
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
              {isEdit ? "Enregistrer les modifications" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL DE CONFIRMATION DE SUPPRESSION
   ═══════════════════════════════════════════════════════════════ */

function DeleteConfirmDialog({
  doc, onCancel, onConfirm,
}: {
  doc: DocumentDTO;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de la suppression.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <h2 className="text-base font-semibold">Supprimer ce document ?</h2>
        </div>

        <p className="mb-1 text-sm text-muted-foreground">
          {docTypeLabels[doc.type]} — {doc.number}
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Cette action est définitive et ne peut pas être annulée.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 disabled:opacity-60"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}