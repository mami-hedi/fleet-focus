import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Calendar, Car, CheckCircle2, Clock, FileText, Wrench, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { docTypeLabels, daysUntil } from "@/lib/mock-data";
import { useFleetStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alertes — FleetOps" }] }),
  component: AlertsPage,
});

type AlertType = "document" | "maintenance" | "vehicle";

interface AlertItem {
  id: string;
  type: AlertType;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  date: string;
  vehicleId?: string;
  link: string;
}

function AlertsPage() {
  const documents = useFleetStore((s) => s.documents);
  const vehicles = useFleetStore((s) => s.vehicles);
  const maintenances = useFleetStore((s) => s.maintenances);
  const dismissAlert = useFleetStore((s) => s.dismissAlert);
  const dismissed = useFleetStore((s) => s.dismissedAlertIds ?? []);

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];

    // ─── Documents expirés ───
    documents.forEach((d) => {
      const days = daysUntil(d.expiryDate);
      if (days < 0) {
        const v = vehicles.find((x) => x.id === d.vehicleId);
        items.push({
          id: `doc-expired-${d.id}`,
          type: "document",
          severity: "critical",
          title: "Document expiré",
          description: `${docTypeLabels[d.type]} de ${v?.brand} ${v?.model} (${v?.plate}) — ${d.number}`,
          date: d.expiryDate,
          vehicleId: d.vehicleId,
          link: "/documents",
        });
      } else if (days >= 0 && days < 30) {
        const v = vehicles.find((x) => x.id === d.vehicleId);
        items.push({
          id: `doc-soon-${d.id}`,
          type: "document",
          severity: "warning",
          title: "Document bientôt expiré",
          description: `${docTypeLabels[d.type]} de ${v?.brand} ${v?.model} (${v?.plate}) expire dans ${days} jours`,
          date: d.expiryDate,
          vehicleId: d.vehicleId,
          link: "/documents",
        });
      }
    });

    // ─── Maintenances à venir ───
    maintenances.forEach((m) => {
      if (m.status === "upcoming") {
        const v = vehicles.find((x) => x.id === m.vehicleId);
        const date = m.scheduledDate ?? m.completedDate ?? "";
        const days = daysUntil(date);
        if (days >= 0 && days < 14) {
          items.push({
            id: `maint-${m.id}`,
            type: "maintenance",
            severity: days < 7 ? "critical" : "warning",
            title: "Maintenance prévue",
            description: `${m.type} pour ${v?.brand} ${v?.model} (${v?.plate}) — ${m.garage}`,
            date,
            vehicleId: m.vehicleId,
            link: "/maintenance",
          });
        }
      }
    });

    // ─── Véhicules avec statut critique ───
    vehicles.forEach((v) => {
      if (v.status === "in_repair") {
        items.push({
          id: `veh-repair-${v.id}`,
          type: "vehicle",
          severity: "warning",
          title: "Véhicule en réparation",
          description: `${v.brand} ${v.model} (${v.plate}) est actuellement indisponible`,
          date: new Date().toISOString().split("T")[0],
          vehicleId: v.id,
          link: `/vehicles/${v.id}`,
        });
      }
    });

    return items.sort((a, b) => {
      const sevOrder = { critical: 0, warning: 1, info: 2 };
      if (sevOrder[a.severity] !== sevOrder[b.severity]) {
        return sevOrder[a.severity] - sevOrder[b.severity];
      }
      return a.date.localeCompare(b.date);
    });
  }, [documents, vehicles, maintenances]);

  const activeAlerts = alerts.filter((a) => !dismissed.includes(a.id));

  const bySeverity = {
    critical: activeAlerts.filter((a) => a.severity === "critical"),
    warning: activeAlerts.filter((a) => a.severity === "warning"),
    info: activeAlerts.filter((a) => a.severity === "info"),
  };

  const severityConfig = {
    critical: { icon: AlertTriangle, label: "Critique", cls: "bg-destructive/10 text-destructive border-destructive/30" },
    warning: { icon: Clock, label: "Attention", cls: "bg-warning/15 text-warning-foreground border-warning/30" },
    info: { icon: Bell, label: "Info", cls: "bg-info/10 text-info border-info/30" },
  };

  const typeIcon = {
    document: FileText,
    maintenance: Wrench,
    vehicle: Car,
  };

  return (
    <AppLayout title="Alertes">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        {/* ─── Cartes de résumé ─── */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            label="Critiques"
            value={bySeverity.critical.length}
            icon={AlertTriangle}
            tint="bg-destructive/10 text-destructive"
          />
          <SummaryCard
            label="Attention"
            value={bySeverity.warning.length}
            icon={Clock}
            tint="bg-warning/15 text-warning-foreground"
          />
          <SummaryCard
            label="Total"
            value={activeAlerts.length}
            icon={Bell}
            tint="bg-muted text-foreground"
          />
        </div>

        {/* ─── Liste des alertes ─── */}
        <div className="space-y-3">
          {activeAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <p className="text-lg font-medium">Aucune alerte active</p>
              <p className="text-sm text-muted-foreground">Tout va bien dans votre parc !</p>
            </div>
          )}

          {activeAlerts.map((alert) => {
            const cfg = severityConfig[alert.severity];
            const Icon = cfg.icon;
            const TypeIcon = typeIcon[alert.type];
            const v = alert.vehicleId ? vehicles.find((x) => x.id === alert.vehicleId) : null;

            return (
              <div
                key={alert.id}
                className={cn(
                  "group relative flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-start sm:gap-4",
                  alert.severity === "critical" && "border-destructive/30 bg-destructive/5",
                  alert.severity === "warning" && "border-warning/30 bg-warning/5",
                  alert.severity === "info" && "border-border bg-card"
                )}
              >
                {/* Icône type */}
                <div className="flex items-center gap-3 sm:flex-col sm:items-center">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", cfg.cls)}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium sm:hidden", cfg.cls)}>
                    {cfg.label}
                  </span>
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold">{alert.title}</h3>
                    <span className={cn("hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex", cfg.cls)}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(alert.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:flex-col">
                  {v && (
                    <Link
                      to={alert.link}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Car className="h-3 w-3" />
                      Voir
                    </Link>
                  )}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                    Ignorer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function SummaryCard({ label, value, icon: Icon, tint }: { label: string; value: number; icon: React.ElementType; tint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-2xl font-semibold">{value}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tint)}>
          <Icon className="h-3 w-3 inline" />
        </span>
      </div>
    </div>
  );
}