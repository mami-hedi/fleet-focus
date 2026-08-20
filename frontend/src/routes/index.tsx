import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Car, CheckCircle2, KeyRound, Wrench, AlertTriangle, TrendingUp,
  ArrowUpRight, CreditCard, Calendar, Clock, Percent,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { utilizationData } from "@/lib/mock-data";
import { useFleetStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Dashboard — FleetOps" },
      { name: "description", content: "Vue d'ensemble du parc automobile : disponibilité, alertes et taux d'utilisation." },
    ],
  }),
  component: Dashboard,
}));

function Dashboard() {
  const vehicles = useFleetStore((s) => s.vehicles);
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

  useEffect(() => {
    if (!reservationsLoaded) fetchReservations();
    if (!paymentsLoaded) fetchPayments({ limit: 5 });
    fetchPaymentStats();
    if (!alertsLoaded) fetchAlerts();
  }, []);

  // ─── Stats véhicules ───
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

  // ─── Stats réservations ───
  const today = new Date().toISOString().split("T")[0];
  const todayRes = reservations.filter((r) => r.startDate === today && r.status !== "cancelled").length;
  const pendingRes = reservations.filter((r) => r.status === "pending").length;
  const activeRes = reservations.filter((r) => r.status === "in_progress").length;

  // ─── Graphique utilisation ───
  const max = Math.max(...utilizationData.map((d) => d.rate), 1);
  const avg = Math.round(utilizationData.reduce((s, d) => s + d.rate, 0) / utilizationData.length);

  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);

  const methodLabel: Record<string, string> = { cash: "Espèces", card: "Carte", transfer: "Virement", cheque: "Chèque" };
  const statusLabel: Record<string, string> = { pending: "En attente", paid: "Payé", partial: "Partiel", refunded: "Remboursé" };
  const statusCls: Record<string, string> = {
    pending: "bg-warning/15 text-warning-foreground",
    paid: "bg-success/10 text-success",
    partial: "bg-info/10 text-info",
    refunded: "bg-muted text-muted-foreground",
  };

  return (
    <AppLayout title="Dashboard">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
          {vehicleStats.map((s) => (
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

        {/* ─── Graphique + Alertes ─── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Graphique utilisation */}
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Taux d'utilisation du parc</h3>
                <p className="text-xs text-muted-foreground">30 derniers jours</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                {avg}% moyen
              </div>
            </div>
            <div className="mt-6 flex h-48 items-end gap-1">
              {utilizationData.map((d) => (
                <div key={d.day} className="group relative flex-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary transition-all hover:opacity-80"
                    style={{ height: `${(d.rate / max) * 100}%` }}
                  />
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 group-hover:opacity-100">
                    {d.rate}%
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>J-30</span>
              <span>J-15</span>
              <span>Aujourd'hui</span>
            </div>
          </div>

          {/* Alertes */}
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
                      {p.method === "cash" ? "💵" : p.method === "card" ? "💳" : p.method === "transfer" ? "🏦" : "📄"}
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
