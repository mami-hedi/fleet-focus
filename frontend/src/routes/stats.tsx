import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3, Car, Wrench, FileText, Fuel, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Calendar, Euro,
  Droplets, Gauge, Activity
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useFleetStore } from "@/lib/store";
import { daysUntil, docTypeLabels } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: "Statistiques — FleetOps" }] }),
  component: StatsPage,
});

function StatsPage() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const maintenances = useFleetStore((s) => s.maintenances);
  const documents = useFleetStore((s) => s.documents);

  // ─── Véhicules ───
  const vehicleStats = useMemo(() => {
    const byStatus = vehicles.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byFuel = vehicles.reduce((acc, v) => {
      acc[v.fuel] = (acc[v.fuel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgMileage = vehicles.length > 0
      ? vehicles.reduce((s, v) => s + v.mileage, 0) / vehicles.length
      : 0;

    const totalMileage = vehicles.reduce((s, v) => s + v.mileage, 0);

    return { byStatus, byFuel, avgMileage, totalMileage, count: vehicles.length };
  }, [vehicles]);

  // ─── Documents ───
  const docStats = useMemo(() => {
    const expired = documents.filter((d) => daysUntil(d.expiryDate) < 0).length;
    const soon = documents.filter((d) => {
      const dd = daysUntil(d.expiryDate);
      return dd >= 0 && dd < 30;
    }).length;
    const valid = documents.length - expired - soon;

    const byType = documents.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { expired, soon, valid, byType, total: documents.length };
  }, [documents]);

  // ─── Maintenance ───
  const maintStats = useMemo(() => {
    const byStatus = maintenances.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCost = maintenances.reduce((s, m) => s + (m.cost || 0), 0);
    const avgCost = maintenances.length > 0 ? totalCost / maintenances.length : 0;

    const upcoming = maintenances.filter((m) => m.status === "upcoming").length;

    return { byStatus, totalCost, avgCost, upcoming, total: maintenances.length };
  }, [maintenances]);

  // ─── Données pour graphiques simples ───
  const statusLabels: Record<string, string> = {
    available: "Disponible",
    in_use: "En utilisation",
    in_repair: "En réparation",
    unavailable: "Indisponible",
  };

  const statusColors: Record<string, string> = {
    available: "bg-success",
    in_use: "bg-info",
    in_repair: "bg-warning",
    unavailable: "bg-destructive",
  };

  const fuelLabels: Record<string, string> = {
    diesel: "Diesel",
    petrol: "Essence",
    electric: "Électrique",
    hybrid: "Hybride",
  };

  const fuelColors: Record<string, string> = {
    diesel: "bg-slate-500",
    petrol: "bg-orange-500",
    electric: "bg-emerald-500",
    hybrid: "bg-cyan-500",
  };

  return (
    <AppLayout title="Statistiques">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:px-8">

        {/* ─── KPIs globaux ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Véhicules"
            value={vehicleStats.count.toString()}
            sub={`${vehicleStats.totalMileage.toLocaleString("fr-FR")} km total`}
            icon={Car}
            tint="bg-primary/10 text-primary"
          />
          <KpiCard
            label="Documents"
            value={docStats.total.toString()}
            sub={`${docStats.expired} expiré${docStats.expired > 1 ? "s" : ""}`}
            icon={FileText}
            tint="bg-info/10 text-info"
          />
          <KpiCard
            label="Maintenances"
            value={maintStats.total.toString()}
            sub={`${maintStats.upcoming} à venir`}
            icon={Wrench}
            tint="bg-warning/15 text-warning-foreground"
          />
          <KpiCard
            label="Coût maintenance"
            value={`${maintStats.totalCost.toLocaleString("fr-FR")} €`}
            sub={`${maintStats.avgCost.toFixed(0)} € en moyenne`}
            icon={Euro}
            tint="bg-success/10 text-success"
          />
        </div>

        {/* ─── Grille de graphiques ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* ─── Répartition par statut ─── */}
          <ChartCard title="Véhicules par statut" icon={Activity}>
            <div className="space-y-3">
              {Object.entries(vehicleStats.byStatus).map(([status, count]) => {
                const pct = (count / vehicleStats.count) * 100;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{statusLabels[status] || status}</span>
                      <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", statusColors[status] || "bg-muted-foreground")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* ─── Répartition par carburant ─── */}
          <ChartCard title="Par type de carburant" icon={Fuel}>
            <div className="space-y-3">
              {Object.entries(vehicleStats.byFuel).map(([fuel, count]) => {
                const pct = (count / vehicleStats.count) * 100;
                return (
                  <div key={fuel}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{fuelLabels[fuel] || fuel}</span>
                      <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", fuelColors[fuel] || "bg-muted-foreground")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* ─── Documents ─── */}
          <ChartCard title="État des documents" icon={FileText}>
            <div className="flex items-center gap-6">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  {docStats.total > 0 && (
                    <>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--success))"
                        strokeWidth="3"
                        strokeDasharray={`${(docStats.valid / docStats.total) * 100}, 100`}
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--warning))"
                        strokeWidth="3"
                        strokeDasharray={`${(docStats.soon / docStats.total) * 100}, 100`}
                        strokeDashoffset={`-${(docStats.valid / docStats.total) * 100}`}
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--destructive))"
                        strokeWidth="3"
                        strokeDasharray={`${(docStats.expired / docStats.total) * 100}, 100`}
                        strokeDashoffset={`-${((docStats.valid + docStats.soon) / docStats.total) * 100}`}
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold">{docStats.total}</span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <LegendItem color="bg-success" label="Valides" value={docStats.valid} />
                <LegendItem color="bg-warning" label="< 30 jours" value={docStats.soon} />
                <LegendItem color="bg-destructive" label="Expirés" value={docStats.expired} />
              </div>
            </div>
          </ChartCard>

          {/* ─── Types de documents ─── */}
          <ChartCard title="Types de documents" icon={FileText}>
            <div className="space-y-3">
              {Object.entries(docStats.byType).map(([type, count]) => {
                const pct = (count / docStats.total) * 100;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{docTypeLabels[type] || type}</span>
                      <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* ─── Maintenances ─── */}
          <ChartCard title="Maintenances par statut" icon={Wrench}>
            <div className="space-y-3">
              {Object.entries(maintStats.byStatus).map(([status, count]) => {
                const pct = (count / maintStats.total) * 100;
                const labels: Record<string, string> = {
                  upcoming: "À venir",
                  in_progress: "En cours",
                  completed: "Terminées",
                };
                const colors: Record<string, string> = {
                  upcoming: "bg-info",
                  in_progress: "bg-warning",
                  completed: "bg-success",
                };
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{labels[status] || status}</span>
                      <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", colors[status] || "bg-muted-foreground")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* ─── Kilométrage ─── */}
          <ChartCard title="Kilométrage du parc" icon={Gauge}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kilométrage moyen</span>
                <span className="text-lg font-semibold">{vehicleStats.avgMileage.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kilométrage total</span>
                <span className="text-lg font-semibold">{vehicleStats.totalMileage.toLocaleString("fr-FR")} km</span>
              </div>
              <div className="space-y-2">
                {vehicles
                  .sort((a, b) => b.mileage - a.mileage)
                  .slice(0, 5)
                  .map((v) => {
                    const pct = (v.mileage / (vehicles[0]?.mileage || 1)) * 100;
                    return (
                      <div key={v.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5">
                            <img src={v.image} alt="" className="h-4 w-6 rounded object-cover" />
                            {v.brand} {v.model}
                          </span>
                          <span>{v.mileage.toLocaleString("fr-FR")} km</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ═══════════════════════════════════════════════════════════════ */

function KpiCard({ label, value, sub, icon: Icon, tint }: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  tint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tint)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        <span className={cn("h-3 w-3 rounded-full", color)} />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}