import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus, Search, Phone, Mail, Car, Calendar, Pencil, Trash2, X,
  Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/drivers")({
  head: () => ({ meta: [{ title: "Conducteurs — FleetOps" }] }),
  component: DriversPage,
});

const ITEMS_PER_PAGE = 10;

// ─── Types ───
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  assignedVehicleId?: string;
  photo?: string;
  status: "active" | "inactive";
}

// ─── Mock data ───
const initialDrivers: Driver[] = [
  {
    id: "d1",
    firstName: "Ahmed",
    lastName: "Ben Ali",
    email: "ahmed.benali@email.com",
    phone: "+216 20 123 456",
    licenseNumber: "TN-123456",
    licenseExpiry: "2026-12-15",
    assignedVehicleId: "v1",
    status: "active",
  },
  {
    id: "d2",
    firstName: "Sonia",
    lastName: "Trabelsi",
    email: "sonia.trabelsi@email.com",
    phone: "+216 21 789 012",
    licenseNumber: "TN-789012",
    licenseExpiry: "2027-03-20",
    assignedVehicleId: "v2",
    status: "active",
  },
  {
    id: "d3",
    firstName: "Karim",
    lastName: "Gharbi",
    email: "karim.gharbi@email.com",
    phone: "+216 22 345 678",
    licenseNumber: "TN-345678",
    licenseExpiry: "2025-08-10",
    status: "inactive",
  },
];

function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Filtrage ───
  const filtered = drivers.filter((d) => {
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    if (!query) return matchStatus;
    const q = query.toLowerCase();
    const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
    return matchStatus && (
      fullName.includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      d.licenseNumber.toLowerCase().includes(q)
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
  const handleSave = (driver: Omit<Driver, "id">, id?: string) => {
    if (id) {
      setDrivers((prev) => prev.map((d) => (d.id === id ? { ...driver, id } : d)));
    } else {
      setDrivers((prev) => [{ ...driver, id: `d${Date.now()}` }, ...prev]);
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setDrivers((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const activeCount = drivers.filter((d) => d.status === "active").length;
  const expiredLicenses = drivers.filter((d) => {
    const days = Math.ceil((new Date(d.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days < 0;
  }).length;

  return (
    <AppLayout
      title="Conducteurs"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un conducteur</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">

        {/* ─── Cartes stats ─── */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Total" value={drivers.length} tint="bg-muted text-foreground" />
          <SummaryCard label="Actifs" value={activeCount} tint="bg-success/10 text-success" />
          <SummaryCard label="Permis expirés" value={expiredLicenses} tint="bg-destructive/10 text-destructive" />
        </div>

        {/* ─── Filtres ─── */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher un conducteur..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "border border-input bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "all" ? "Tous" : s === "active" ? "Actifs" : "Inactifs"}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Tableau Desktop ─── */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conducteur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Permis</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((d) => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(d.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const isExpired = daysUntilExpiry < 0;
                const isSoon = daysUntilExpiry >= 0 && daysUntilExpiry < 60;

                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {d.firstName[0]}{d.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{d.firstName} {d.lastName}</p>
                          <p className="font-mono text-xs text-muted-foreground">{d.licenseNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="flex items-center gap-1.5 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {d.email}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {d.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-sm",
                        isExpired && "text-destructive font-medium",
                        isSoon && "text-warning-foreground font-medium"
                      )}>
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(d.licenseExpiry).toLocaleDateString("fr-FR")}
                        {isExpired && " (Expiré)"}
                        {isSoon && !isExpired && ` (${daysUntilExpiry}j)`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        d.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {d.status === "active" ? "Actif" : "Inactif"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(d); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(d)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun conducteur trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── Cartes Mobile ─── */}
        <div className="sm:hidden space-y-3">
          {paginated.map((d) => {
            const daysUntilExpiry = Math.ceil(
              (new Date(d.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isExpired = daysUntilExpiry < 0;
            const isSoon = daysUntilExpiry >= 0 && daysUntilExpiry < 60;

            return (
              <div key={d.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {d.firstName[0]}{d.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.firstName} {d.lastName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{d.licenseNumber}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                    d.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    {d.status === "active" ? "Actif" : "Inactif"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Email</p>
                    <p className="text-xs">{d.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Téléphone</p>
                    <p className="text-xs">{d.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Permis expire le</p>
                    <p className={cn(
                      isExpired && "text-destructive font-medium",
                      isSoon && !isExpired && "text-warning-foreground font-medium"
                    )}>
                      {new Date(d.licenseExpiry).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                      {isExpired && " (Expiré)"}
                      {isSoon && !isExpired && ` — ${daysUntilExpiry} jours restants`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setEditing(d); setDialogOpen(true); }}>
                    <Pencil className="h-3 w-3" /> Modifier
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => setDeleteTarget(d)}>
                    <Trash2 className="h-3 w-3" /> Supprimer
                  </Button>
                </div>
              </div>
            );
          })}
          {paginated.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Aucun conducteur trouvé.
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

      {/* ─── Dialog ─── */}
      {dialogOpen && (
        <DriverDialog
          driver={editing}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {/* ─── Delete Dialog ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce conducteur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${deleteTarget.firstName} ${deleteTarget.lastName} sera définitivement supprimé.`}
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

function SummaryCard({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
      <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 sm:mt-2 flex items-center gap-2 sm:gap-3">
        <span className="text-xl sm:text-2xl font-semibold">{value}</span>
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

function DriverDialog({
  driver,
  onClose,
  onSave,
}: {
  driver: Driver | null;
  onClose: () => void;
  onSave: (d: Omit<Driver, "id">, id?: string) => void;
}) {
  const [firstName, setFirstName] = useState(driver?.firstName ?? "");
  const [lastName, setLastName] = useState(driver?.lastName ?? "");
  const [email, setEmail] = useState(driver?.email ?? "");
  const [phone, setPhone] = useState(driver?.phone ?? "");
  const [licenseNumber, setLicenseNumber] = useState(driver?.licenseNumber ?? "");
  const [licenseExpiry, setLicenseExpiry] = useState(driver?.licenseExpiry ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(driver?.status ?? "active");
  const [photo, setPhoto] = useState<string | null>(driver?.photo ?? null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPhoto(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !licenseNumber || !licenseExpiry) return;
    onSave(
      {
        firstName,
        lastName,
        email,
        phone,
        licenseNumber: licenseNumber.toUpperCase(),
        licenseExpiry,
        status,
        photo: photo ?? undefined,
      },
      driver?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{driver ? "Modifier le conducteur" : "Ajouter un conducteur"}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Photo</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={cn(
                "relative rounded-xl border-2 border-dashed p-4 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : photo ? "border-success bg-success/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {photo ? (
                <div className="space-y-2">
                  <img src={photo} alt="" className="mx-auto h-24 rounded-full object-cover w-24" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setPhoto(null); }} className="text-xs text-destructive hover:underline">Supprimer</button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted"><Upload className="h-4 w-4 text-muted-foreground" /></div>
                  <p className="text-xs text-muted-foreground">Cliquer ou glisser une photo</p>
                </div>
              )}
            </div>
          </div>

          {/* Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Prénom *</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom *</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Téléphone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 XX XXX XXX" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {/* Permis */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">N° Permis *</label>
              <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())} required placeholder="TN-123456" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Expiration *</label>
              <input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Statut</label>
            <div className="flex rounded-lg border border-input bg-background p-0.5">
              <button type="button" onClick={() => setStatus("active")} className={cn("flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors", status === "active" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Actif</button>
              <button type="button" onClick={() => setStatus("inactive")} className={cn("flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors", status === "inactive" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Inactif</button>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted">Annuler</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">{driver ? "Enregistrer" : "Ajouter"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}