import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, CheckCircle2, KeyRound, Wrench, AlertTriangle, TrendingUp, ArrowUpRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { vehicles, alerts, utilizationData, getVehicle } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FleetOps" },
      { name: "description", content: "Vue d'ensemble du parc automobile : disponibilité, alertes et taux d'utilisation." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const total = vehicles.length;
  const available = vehicles.filter((v) => v.status === "available").length;
  const rented = vehicles.filter((v) => v.status === "rented").length;
  const maintenance = vehicles.filter((v) => v.status === "maintenance").length;
  const out = vehicles.filter((v) => v.status === "out_of_service").length;

  const stats = [
    { label: "Total véhicules", value: total, icon: Car, tint: "text-foreground bg-muted" },
    { label: "Disponibles", value: available, icon: CheckCircle2, tint: "text-success bg-success/10" },
    { label: "Loués", value: rented, icon: KeyRound, tint: "text-info bg-info/10" },
    { label: "Maintenance", value: maintenance, icon: Wrench, tint: "text-warning-foreground bg-warning/20" },
    { label: "Hors service", value: out, icon: AlertTriangle, tint: "text-destructive bg-destructive/10" },
  ];

  const max = Math.max(...utilizationData.map((d) => d.rate));
  const avg = Math.round(utilizationData.reduce((s, d) => s + d.rate, 0) / utilizationData.length);

  return (
    <AppLayout title="Dashboard">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Vue d'ensemble</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Bonjour 👋</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici l'état actuel de votre parc au {new Date("2026-07-11").toLocaleDateString("fr-FR", { dateStyle: "long" })}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {stats.map((s) => (
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

        <div className="grid gap-6 lg:grid-cols-3">
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

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Alertes actives</h3>
                <p className="text-xs text-muted-foreground">{alerts.length} à traiter</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {alerts.map((a) => {
                const v = getVehicle(a.vehicleId);
                const sev =
                  a.severity === "high"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : a.severity === "medium"
                      ? "bg-warning/15 text-warning-foreground border-warning/30"
                      : "bg-muted text-muted-foreground border-border";
                return (
                  <li key={a.id}>
                    <Link
                      to="/vehicles/$id"
                      params={{ id: a.vehicleId }}
                      className={cn("flex items-start gap-3 rounded-lg border p-3 text-xs transition-colors hover:bg-accent/30", sev)}
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{a.message}</p>
                        <p className="mt-1 text-[11px] opacity-80">
                          {v?.brand} {v?.model} · {v?.plate}
                        </p>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">Activité récente du parc</h3>
            <Link to="/vehicles" className="text-xs font-medium text-primary hover:underline">
              Tout voir →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {vehicles.slice(0, 5).map((v) => (
              <li key={v.id} className="flex items-center gap-4 px-5 py-3">
                <img src={v.image} alt="" className="h-10 w-16 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {v.brand} {v.model}
                  </p>
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
