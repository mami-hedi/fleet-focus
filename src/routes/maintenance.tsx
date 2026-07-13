import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Calendar } from "lucide-react";
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

function MaintenancePage() {
  const maintenances = useFleetStore((s) => s.maintenances);
  const vehicles = useFleetStore((s) => s.vehicles);
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const filtered = useMemo(
    () => (filter === "all" ? maintenances : maintenances.filter((m) => m.status === filter)),
    [maintenances, filter],
  );

  return (
    <AppLayout
      title="Maintenance"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Planifier
        </Button>
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1 w-fit">
          {(Object.keys(filterLabels) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
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

        <div className="overflow-hidden rounded-xl border border-border bg-card">
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
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Aucune maintenance dans cette catégorie.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((m) => {
                const v = vehicles.find((x) => x.id === m.vehicleId);
                const status = {
                  upcoming: { label: "À venir", cls: "bg-info/15 text-info" },
                  in_progress: { label: "En cours", cls: "bg-warning/20 text-warning-foreground" },
                  completed: { label: "Terminée", cls: "bg-success/15 text-success" },
                }[m.status];
                return (
                  <TableRow key={m.id}>
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
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <MaintenanceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppLayout>
  );
}
