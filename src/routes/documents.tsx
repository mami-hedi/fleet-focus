import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { docTypeLabels, daysUntil } from "@/lib/mock-data";
import { useFleetStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documents & conformité — FleetOps" }] }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const documents = useFleetStore((s) => s.documents);
  const vehicles = useFleetStore((s) => s.vehicles);
  const sorted = [...documents].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  const expired = sorted.filter((d) => daysUntil(d.expiryDate) < 0).length;
  const soon = sorted.filter((d) => { const dd = daysUntil(d.expiryDate); return dd >= 0 && dd < 30; }).length;

  return (
    <AppLayout title="Documents & conformité">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card label="Documents suivis" value={documents.length} tint="bg-muted text-foreground" />
          <Card label="Expiration < 30 jours" value={soon} tint="bg-warning/20 text-warning-foreground" />
          <Card label="Expirés" value={expired} tint="bg-destructive/10 text-destructive" />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Véhicule</TableHead>
                <TableHead>Type de document</TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Date d'expiration</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((d) => {
                const v = vehicles.find((x) => x.id === d.vehicleId);
                const days = daysUntil(d.expiryDate);
                const urgency = days < 0 ? "expired" : days < 30 ? "soon" : "ok";
                const cfg = {
                  expired: { cls: "bg-destructive/10 text-destructive border-destructive/30", label: `Expiré depuis ${Math.abs(days)} j` },
                  soon: { cls: "bg-warning/15 text-warning-foreground border-warning/30", label: `Expire dans ${days} j` },
                  ok: { cls: "bg-success/10 text-success border-success/20", label: "Valide" },
                }[urgency];
                return (
                  <TableRow key={d.id} className={urgency !== "ok" ? "bg-muted/30" : undefined}>
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
                    <TableCell className="text-sm">{docTypeLabels[d.type]}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{d.number}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(d.expiryDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cfg.cls)}>
                        {urgency !== "ok" && <AlertTriangle className="h-3 w-3" />}
                        {cfg.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}

function Card({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-2xl font-semibold">{value}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tint)}>docs</span>
      </div>
    </div>
  );
}
