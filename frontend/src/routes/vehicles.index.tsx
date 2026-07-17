import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, LayoutGrid, List, Plus, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { VehicleCard } from "@/components/VehicleCard";
import { VehicleImage } from "@/components/VehicleImage";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Link } from "@tanstack/react-router";
import { fuelLabels, statusLabels, type Vehicle, type VehicleStatus, type FuelType } from "@/lib/mock-data";
import { useFleetStore } from "@/lib/store";
import { VehicleFormDialog } from "@/components/VehicleFormDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vehicles/")({
  head: () => ({
    meta: [
      { title: "Véhicules — FleetOps" },
      { name: "description", content: "Liste et filtres des véhicules du parc." },
    ],
  }),
  component: VehiclesList,
});

function VehiclesList() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const deleteVehicle = useFleetStore((s) => s.deleteVehicle);
  const vehiclesLoading = useFleetStore((s) => s.vehiclesLoading);
  const vehiclesError = useFleetStore((s) => s.vehiclesError);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VehicleStatus | "all">("all");
  const [brand, setBrand] = useState<string>("all");
  const [fuel, setFuel] = useState<FuelType | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const brands = Array.from(new Set(vehicles.map((v) => v.brand)));

  const filtered = useMemo(
    () =>
      vehicles.filter((v) => {
        if (status !== "all" && v.status !== status) return false;
        if (brand !== "all" && v.brand !== brand) return false;
        if (fuel !== "all" && v.fuel !== fuel) return false;
        if (query) {
          const q = query.toLowerCase();
          if (!v.plate.toLowerCase().includes(q) && !v.model.toLowerCase().includes(q) && !v.brand.toLowerCase().includes(q))
            return false;
        }
        return true;
      }),
    [vehicles, query, status, brand, fuel],
  );

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (v: Vehicle) => { setEditing(v); setDialogOpen(true); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVehicle(deleteTarget.id);
      toast.success(`${deleteTarget.brand} ${deleteTarget.model} supprimé`);
    } catch (err) {
      toast.error((err as Error).message || "Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <AppLayout
      title="Véhicules"
      actions={
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Ajouter un véhicule
        </Button>
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par immatriculation ou modèle..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as VehicleStatus | "all")}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {(Object.keys(statusLabels) as VehicleStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Marque" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes marques</SelectItem>
                {brands.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={fuel} onValueChange={(v) => setFuel(v as FuelType | "all")}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Carburant" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous carburants</SelectItem>
                {(Object.keys(fuelLabels) as FuelType[]).map((f) => (
                  <SelectItem key={f} value={f}>{fuelLabels[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex overflow-hidden rounded-md border border-border">
              <button
                onClick={() => setView("grid")}
                className={cn("flex items-center gap-1.5 px-3 py-2 text-xs", view === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("flex items-center gap-1.5 px-3 py-2 text-xs", view === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted")}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} véhicule{filtered.length > 1 ? "s" : ""}</p>

        {vehiclesError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {vehiclesError}
          </div>
        )}

        {vehiclesLoading && vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chargement des véhicules...</p>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((v) => (
              <div key={v.id} className="group relative">
                <VehicleCard vehicle={v} />
                <div className="absolute right-3 bottom-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => { e.preventDefault(); openEdit(v); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => { e.preventDefault(); setDeleteTarget(v); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Immatriculation</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Carburant</TableHead>
                  <TableHead>Kilométrage</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Link to="/vehicles/$id" params={{ id: v.id }} className="flex items-center gap-3">
                        <VehicleImage src={v.image} alt="" className="h-10 w-16 shrink-0 rounded object-cover" iconClassName="h-4 w-4" />
                        <span className="font-medium">{v.brand} {v.model}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{v.plate}</TableCell>
                    <TableCell>{v.year}</TableCell>
                    <TableCell>{fuelLabels[v.fuel]}</TableCell>
                    <TableCell>{v.mileage.toLocaleString("fr-FR")} km</TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(v)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(v)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <VehicleFormDialog open={dialogOpen} onOpenChange={setDialogOpen} vehicle={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce véhicule ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${deleteTarget.brand} ${deleteTarget.model} (${deleteTarget.plate}) sera retiré du parc, avec ses documents, maintenances et états des lieux.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}