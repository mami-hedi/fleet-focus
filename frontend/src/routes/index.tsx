import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Car, CheckCircle2, KeyRound, Wrench, AlertTriangle, TrendingUp,
  ArrowUpRight, CreditCard, Calendar, Clock, Percent, FileText,
  Fuel, Euro, Gauge, Activity, ClipboardList,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { utilizationData, daysUntil, docTypeLabels } from "@/lib/mock-data";
import { useFleetStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Dashboard — FleetOps" },
      { name: "description", content: "Vue d'ensemble du parc automobile : disponibilité, alertes, finances et statistiques." },
    ],
  }),
  component: Dashboard,
}));

function Dashboard() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const vehiclesLoaded = useFleetStore((s) => s.vehiclesLoaded);
  const vehiclesLoading = useFleetStore((s) => s.vehiclesLoading);
  const fetchVehicles = useFleetStore((s) => s.fetchVehicles);
  const reservations = useFleetStore((s) => s.reservations);
  const reservationsLoaded = useFleetStore((s) => s.reservationsLoaded);
  const fetchReservations = useFleetStore((s) => s.fetchReservations);
  const paymentStats = useFleetStore((s) => s.paymentStats);
  const fetchPaymentStats = useFleetStore((s) => s.fetchPaymentStats);
  const payments = useFleetStore((s) => s.payments);
  const fetchPayments = useFleetStore((s) => s.fetchPayments);
  const paymentsLoaded = useFleetStore((s) => s.paymentsLoaded);
  const alerts = useFleetStore((s) => s.alerts);
  const fetchAlerts = useFleetStore((s) => s.fetchAlerts);
  const alertsLoaded = useFleetStore((s) => s.alertsLoaded);
  const maintenances = useFleetStore((s) => s.maintenances);
  const maintenancesLoaded = useFleetStore((s) => s.maintenancesLoaded);
  const maintenancesLoading = useFleetStore((s) => s.maintenancesLoading);
  const fetchMaintenances = useFleetStore((s) => s.fetchMaintenances);
  const documents = useFleetStore((s) => s.documents);
  const documentsLoaded = useFleetStore((s) => s.documentsLoaded);
  const documentsLoading = useFleetStore((s) => s.documentsLoading);
  const fetchDocuments = useFleetStore((s) => s.fetchDocuments);

  // Le Dashboard est rendu en SSR avec l'état initial du store (tableaux vides),
  // puis hydraté côté client où les fetchX() ci-dessous vont chercher les
  // vraies données. Le graphique d'utilisation plus bas dépend de valeurs
  // générées aléatoirement dans mock-data.ts, ce qui produit un mismatch
  // d'hydratation (le serveur et le client tirent des nombres différents).
  // On ne rend ce bloc qu'après le montage client pour l'éviter proprement,
  // sans dépendre d'un correctif dans mock-data.ts.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!vehiclesLoaded) fetchVehicles();
    if (!reservationsLoaded) fetchReservations();
    if (!paymentsLoaded) fetchPayments({ limit: 5 });
    fetchPaymentStats();
    if (!alertsLoaded) fetchAlerts();
    if (!maintenancesLoaded) fetchMaintenances();
    if (!documentsLoaded) fetchDocuments();
  }, []);

  // ─── Véhicules ───
  const total = vehicles.length;
  const available = vehicles.filter((v) => v.status === "available").length;
  const rented = vehicles.filter((v) => v.status === "rented").length;
  const maintenance = vehicles.filter((v) => v.status === "maintenance").length;
  const out = vehicles.filter((v) => v.status === "out_of_service").length;

  const vehicleStats = [
    { label: "Total véhicules", value: total, icon: Car, tint: "text-foreground bg-muted" },
    { label: "Disponibles", value: available, icon: CheckCircle2, tint: "text-success bg-success/10" },
    { label: "Loués", value: rented, icon: KeyRound, tint: "text-info bg-info/10" },
    { label: "Maintenance", value: maintenance, icon: Wrench, tint: "text-warning-foreground bg-warning/20" },
    { label: "Hors service", value: out, icon: AlertTriangle, tint: "text-destructive bg-destructive/10" },
  ];

  const statusLabels: Record<string, string> = {
    available: "Disponible",
    rented: "Loué",
    maintenance: "Maintenance",
    out_of_service: "Hors service",
  };
  const statusColors: Record<string, string> = {
    available: "bg-success",
    rented: "bg-info",
    maintenance: "bg-warning",
    out_of_service: "bg-destructive",
  };

  const fuelStats = useMemo(() => {
    return vehicles.reduce((acc, v) => {
      acc[v.fuel] = (acc[v.fuel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [vehicles]);

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

  const mileageStats = useMemo(() => {
    const avgMileage = vehicles.length > 0
      ? vehicles.reduce((s, v) => s + v.mileage, 0) / vehicles.length
      : 0;
    const totalMileage = vehicles.reduce((s, v) => s + v.mileage, 0);
    const top5 = [...vehicles].sort((a, b) => b.mileage - a.mileage).slice(0, 5);
    return { avgMileage, totalMileage, top5, max: top5[0]?.mileage || 1 };
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

  const maintStatusLabels: Record<string, string> = {
    upcoming: "À venir",
    in_progress: "En cours",
    completed: "Terminées",
  };
  const maintStatusColors: Record<string, string> = {
    upcoming: "bg-info",
    in_progress: "bg-warning",
    completed: "bg-success",
  };

  // ─── Réservations ───
  const today = new Date().toISOString().split("T")[0];
  const todayRes = reservations.filter((r) => r.startDate === today && r.status !== "cancelled").length;
  const pendingRes = reservations.filter((r) => r.status === "pending").length;

  const resStatusStats = useMemo(() => {
    return reservations.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [reservations]);

  const resStatusLabels: Record<string, string> = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminée",
    cancelled: "Annulée",
  };
  const resStatusColors: Record<string, string> = {
    pending: "bg-warning",
    in_progress: "bg-info",
    completed: "bg-success",
    cancelled: "bg-destructive",
  };

  // ─── Paiements par mode ───
  const paymentMethodStats = useMemo(() => {
    return payments.reduce((acc, p) => {
      if (!acc[p.method]) acc[p.method] = { count: 0, amount: 0 };
      acc[p.method].count += 1;
      acc[p.method].amount += p.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
  }, [payments]);

  const methodLabel: Record<string, string> = { cash: "Espèces", card: "Carte", transfer: "Virement", cheque: "Chèque" };
  const methodIcon: Record<string, string> = { cash: "💵", card: "💳", transfer: "🏦", cheque: "📄" };
  const statusLabel: Record<string, string> = { pending: "En attente", paid: "Payé", partial: "Partiel", refunded: "Remboursé" };
  const statusCls: Record<string, string> = {
    pending: "bg-warning/15 text-warning-foreground",
    paid: "bg-success/10 text-success",
    partial: "bg-info/10 text-info",
    refunded: "bg-muted text-muted-foreground",
  };

  const totalPaymentAmount = Object.values(paymentMethodStats).reduce((s, v) => s + v.amount, 0);

  // ─── Graphique utilisation ───
  const max = Math.max(...utilizationData.map((d) => d.rate), 1);
  const avg = Math.round(utilizationData.reduce((s, d) => s + d.rate, 0) / utilizationData.length);

  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);

  return (
    <AppLayout title="Dashboard">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        {/* ─── Greeting ─── */}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Vue d'ensemble</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Bonjour 👋</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici l'état actuel de votre parc au{" "}
            {new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}.
          </p>
        </div>

        {/* ─── KPI Véhicules ─── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {vehiclesLoading && !vehiclesLoaded
            ? Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
            : vehicleStats.map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", s.tint)}>
                      <s.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
        </div>

        {/* ─── KPI Réservations + Paiements ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link to="/reservations" className="rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </span>
            <div className="mt-3 text-2xl font-semibold">{todayRes}</div>
            <div className="text-xs text-muted-foreground">Réservations aujourd'hui</div>
          </Link>
          <Link to="/reservations" className="rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/20 text-warning-foreground">
              <Clock className="h-4 w-4" />
            </span>
            <div className="mt-3 text-2xl font-semibold">{pendingRes}</div>
            <div className="text-xs text-muted-foreground">Réservations en attente</div>
          </Link>
          <Link to="/payments" className="rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
              <CreditCard className="h-4 w-4" />
            </span>
            <div className="mt-3 text-2xl font-semibold">
              {paymentStats ? `${paymentStats.monthRevenue.toFixed(0)} TND` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Revenus ce mois</div>
          </Link>
          <Link to="/payments" className="rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info">
              <Percent className="h-4 w-4" />
            </span>
            <div className="mt-3 text-2xl font-semibold">
              {paymentStats ? `${paymentStats.recoveryRate}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Taux recouvrement</div>
          </Link>
        </div>

        {/* ─── KPI Documents + Maintenance ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="Documents"
            value={docStats.total.toString()}
            sub={`${docStats.expired} expiré${docStats.expired > 1 ? "s" : ""}`}
            icon={FileText}
            tint="bg-info/10 text-info"
          />
          <KpiCard
            label="Docs < 30 jours"
            value={docStats.soon.toString()}
            sub="à renouveler bientôt"
            icon={AlertTriangle}
            tint="bg-warning/15 text-warning-foreground"
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

        {/* ─── Graphique utilisation + Alertes ─── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Taux d'utilisation du parc</h3>
                <p className="text-xs text-muted-foreground">30 derniers jours</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                {mounted ? `${avg}% moyen` : "— % moyen"}
              </div>
            </div>
            <div className="mt-6 flex h-48 items-end gap-1">
              {mounted ? (
                utilizationData.map((d) => (
                  <div key={d.day} className="group relative flex-1">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary transition-all hover:opacity-80"
                      style={{ height: `${(d.rate / max) * 100}%` }}
                    />
                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 group-hover:opacity-100">
                      {d.rate}%
                    </div>
                  </div>
                ))
              ) : (
                // Placeholder statique identique au serveur : évite tout mismatch
                // d'hydratation tant que les vraies barres (client-only) n'ont pas pris le relais.
                <div className="flex h-full w-full items-end gap-1 opacity-40">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="w-full flex-1 rounded-t-md bg-muted" style={{ height: "40%" }} />
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>J-30</span>
              <span>J-15</span>
              <span>Aujourd'hui</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Alertes actives</h3>
                <p className="text-xs text-muted-foreground">{alerts.length} à traiter</p>
              </div>
              <Link to="/alerts" className="text-xs font-medium text-primary hover:underline">
                Voir tout →
              </Link>
            </div>
            <ul className="mt-4 space-y-2.5">
              {alerts.slice(0, 5).map((a) => {
                const v = getVehicle(a.vehicleId ?? "");
                const sev =
                  a.severity === "high"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : a.severity === "medium"
                      ? "bg-warning/15 text-warning-foreground border-warning/30"
                      : "bg-muted text-muted-foreground border-border";
                return (
                  <li key={a.id}>
                    <Link
                      to="/alerts"
                      className={cn("flex items-start gap-3 rounded-lg border p-3 text-xs transition-colors hover:bg-accent/30", sev)}
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{a.message ?? a.label}</p>
                        {v && (
                          <p className="mt-1 text-[11px] opacity-80">
                            {v.brand} {v.model} · {v.plate}
                          </p>
                        )}
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </li>
                );
              })}
              {alerts.length === 0 && (
                <li className="rounded-lg bg-muted/50 p-3 text-center text-xs text-muted-foreground">
                  Aucune alerte active ✓
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* ─── Grille de statistiques détaillées ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Véhicules par statut */}
          <ChartCard title="Véhicules par statut" icon={Activity}>
            <div className="space-y-3">
              {(["available", "rented", "maintenance", "out_of_service"] as const).map((status) => {
                const count = vehicles.filter((v) => v.status === status).length;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{statusLabels[status]}</span>
                      <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", statusColors[status])} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* Par carburant */}
          <ChartCard title="Par type de carburant" icon={Fuel}>
            <div className="space-y-3">
              {Object.entries(fuelStats).map(([fuel, count]) => {
                const pct = total > 0 ? (count / total) * 100 : 0;
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

          {/* État des documents */}
          <ChartCard title="État des documents" icon={FileText}>
            <div className="flex items-center gap-6">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  {docStats.total > 0 && (
                    <>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="hsl(var(--success))" strokeWidth="3"
                        strokeDasharray={`${(docStats.valid / docStats.total) * 100}, 100`}
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="hsl(var(--warning))" strokeWidth="3"
                        strokeDasharray={`${(docStats.soon / docStats.total) * 100}, 100`}
                        strokeDashoffset={`-${(docStats.valid / docStats.total) * 100}`}
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="hsl(var(--destructive))" strokeWidth="3"
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

          {/* Types de documents */}
          <ChartCard title="Types de documents" icon={FileText}>
            <div className="space-y-3">
              {Object.entries(docStats.byType).map(([type, count]) => {
                const pct = docStats.total > 0 ? (count / docStats.total) * 100 : 0;
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

          {/* Maintenances par statut */}
          <ChartCard title="Maintenances par statut" icon={Wrench}>
            <div className="space-y-3">
              {Object.entries(maintStats.byStatus).map(([status, count]) => {
                const pct = maintStats.total > 0 ? (count / maintStats.total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{maintStatusLabels[status] || status}</span>
                      <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", maintStatusColors[status] || "bg-muted-foreground")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* Kilométrage du parc */}
          <ChartCard title="Kilométrage du parc" icon={Gauge}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kilométrage moyen</span>
                <span className="text-lg font-semibold">{mileageStats.avgMileage.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kilométrage total</span>
                <span className="text-lg font-semibold">{mileageStats.totalMileage.toLocaleString("fr-FR")} km</span>
              </div>
              <div className="space-y-2">
                {mileageStats.top5.map((v) => {
                  const pct = (v.mileage / mileageStats.max) * 100;
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

          {/* NOUVEAU : Réservations par statut */}
          <ChartCard title="Réservations par statut" icon={ClipboardList}>
            <div className="space-y-3">
              {Object.entries(resStatusStats).map(([status, count]) => {
                const pct = reservations.length > 0 ? (count / reservations.length) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{resStatusLabels[status] || status}</span>
                      <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", resStatusColors[status] || "bg-muted-foreground")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {reservations.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Aucune réservation</p>
              )}
            </div>
          </ChartCard>

          {/* NOUVEAU : Revenus par mode de paiement */}
          <ChartCard title="Revenus par mode de paiement" icon={CreditCard}>
            <div className="space-y-3">
              {Object.entries(paymentMethodStats).map(([method, { count, amount }]) => {
                const pct = totalPaymentAmount > 0 ? (amount / totalPaymentAmount) * 100 : 0;
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{methodIcon[method]} {methodLabel[method] || method} <span className="text-xs text-muted-foreground">({count})</span></span>
                      <span className="font-medium">{amount.toFixed(0)} TND ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {payments.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Aucun paiement</p>
              )}
            </div>
          </ChartCard>
        </div>

        {/* ─── Paiements récents ─── */}
        {payments.length > 0 && (
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold">Paiements récents</h3>
              <Link to="/payments" className="text-xs font-medium text-primary hover:underline">
                Tout voir →
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {payments.slice(0, 5).map((p) => {
                const res = reservations.find((r) => r.id === p.reservationId);
                const v = res?.vehicleId ? getVehicle(res.vehicleId) : null;
                return (
                  <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                      {methodIcon[p.method]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{res?.clientName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {v ? `${v.brand} ${v.model}` : ""} · {methodLabel[p.method]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{p.amount.toFixed(2)} TND</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusCls[p.status])}>
                        {statusLabel[p.status]}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ─── Activité véhicules ─── */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">Parc automobile</h3>
            <Link to="/vehicles" className="text-xs font-medium text-primary hover:underline">
              Tout voir →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {vehicles.slice(0, 5).map((v) => (
              <li key={v.id} className="flex items-center gap-4 px-5 py-3">
                <img src={v.image} alt="" className="h-10 w-16 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{v.brand} {v.model}</p>
                  <p className="font-mono text-xs text-muted-foreground">{v.plate}</p>
                </div>
                <StatusBadge status={v.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ═══════════════════════════════════════════════════════════════ */

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-muted" />
      <div className="mt-3 h-7 w-10 rounded bg-muted" />
      <div className="mt-2 h-3 w-16 rounded bg-muted" />
    </div>
  );
}

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