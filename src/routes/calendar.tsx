import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Car, Wrench, FileText, AlertTriangle, Clock,
  Plus, Filter, X, MapPin, User
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFleetStore } from "@/lib/store";
import { daysUntil, docTypeLabels } from "@/lib/mock-data";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendrier — FleetOps" }] }),
  component: CalendarPage,
});

type ViewMode = "month" | "week" | "day";
type EventType = "reservation" | "maintenance" | "document" | "inspection";

interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  vehicleId?: string;
  color: string;
  details?: string;
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DAYS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const eventConfig: Record<EventType, { icon: React.ElementType; label: string }> = {
  reservation: { icon: Car, label: "Réservation" },
  maintenance: { icon: Wrench, label: "Maintenance" },
  document: { icon: FileText, label: "Document" },
  inspection: { icon: AlertTriangle, label: "État des lieux" },
};

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 14)); // Juillet 2026
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterTypes, setFilterTypes] = useState<EventType[]>(["reservation", "maintenance", "document", "inspection"]);
  const [showFilters, setShowFilters] = useState(false);

  const vehicles = useFleetStore((s) => s.vehicles);
  const maintenances = useFleetStore((s) => s.maintenances);
  const documents = useFleetStore((s) => s.documents);
  const inspections = useFleetStore((s) => s.inspections);

  // ─── Générer les événements ───
  const events: CalendarEvent[] = [
    // Réservations (mock)
    ...[
      { id: "r1", vehicleId: "v1", date: "2026-07-15", time: "08:00", endTime: "10:00", title: "Transfert aéroport — Jean Dupont", type: "reservation" as EventType, color: "bg-primary" },
      { id: "r2", vehicleId: "v1", date: "2026-07-15", time: "14:00", endTime: "15:30", title: "Transfert — Marie Martin", type: "reservation" as EventType, color: "bg-primary" },
      { id: "r3", vehicleId: "v2", date: "2026-07-14", time: "09:00", endTime: "18:00", title: "Circuit journée — Groupe Evasion", type: "reservation" as EventType, color: "bg-info" },
      { id: "r4", vehicleId: "v3", date: "2026-07-16", endDate: "2026-07-18", title: "Voyage Djerba — Famille Alves", type: "reservation" as EventType, color: "bg-success" },
      { id: "r5", vehicleId: "v2", date: "2026-07-20", time: "10:00", endTime: "12:00", title: "Transfert hôtel — M. Ben Salah", type: "reservation" as EventType, color: "bg-primary" },
      { id: "r6", vehicleId: "v1", date: "2026-07-22", time: "07:00", endTime: "09:00", title: "Aéroport — Mme Dubois", type: "reservation" as EventType, color: "bg-primary" },
      { id: "r7", vehicleId: "v4", date: "2026-07-25", time: "08:00", endTime: "20:00", title: "Excursion désert — Groupe 12 pers.", type: "reservation" as EventType, color: "bg-warning" },
    ],
    // Maintenances
    ...maintenances
      .filter((m) => m.status !== "completed")
      .map((m) => ({
        id: `m-${m.id}`,
        vehicleId: m.vehicleId,
        date: m.scheduledDate || m.completedDate || "",
        title: `${m.type} — ${m.garage}`,
        type: "maintenance" as EventType,
        color: "bg-warning",
        details: m.recurrence ? `Récurrence: ${m.recurrence}` : undefined,
      })),
    // Documents expirants
    ...documents
      .filter((d) => {
        const days = daysUntil(d.expiryDate);
        return days >= 0 && days < 30;
      })
      .map((d) => ({
        id: `d-${d.id}`,
        vehicleId: d.vehicleId,
        date: d.expiryDate,
        title: `Expire: ${docTypeLabels[d.type]}`,
        type: "document" as EventType,
        color: "bg-destructive",
      })),
    // Inspections
    ...inspections.map((i) => ({
      id: `i-${i.id}`,
      vehicleId: i.vehicleId,
      date: i.date,
      title: `État des lieux (${i.type})`,
      type: "inspection" as EventType,
      color: "bg-purple-500",
    })),
  ].filter((e) => filterTypes.includes(e.type));

  // ─── Navigation ───
  const goToPrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goToNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  // ─── Helpers dates ───
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  // ─── Vue Mensuelle ───
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const today = new Date();
    const isToday = (d: number) =>
      d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header jours */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_SHORT.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        {/* Grille */}
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            if (d === null) return <div key={`empty-${i}`} className="min-h-[100px] sm:min-h-[120px] border-b border-r border-border bg-muted/30" />;

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const dayEvents = events.filter((e) => {
              if (e.date === dateStr) return true;
              if (e.endDate) {
                const start = new Date(e.date).getTime();
                const end = new Date(e.endDate).getTime();
                const current = new Date(dateStr).getTime();
                return current >= start && current <= end;
              }
              return false;
            });

            return (
              <div
                key={d}
                className={cn(
                  "min-h-[100px] sm:min-h-[120px] border-b border-r border-border p-1 sm:p-2 transition-colors hover:bg-muted/50 cursor-pointer",
                  isToday(d) && "bg-primary/5"
                )}
                onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
              >
                <div className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                  isToday(d) ? "bg-primary text-primary-foreground" : "text-foreground"
                )}>
                  {d}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => {
                    const Icon = eventConfig[e.type].icon;
                    return (
                      <div
                        key={e.id}
                        className={cn(
                          "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white truncate",
                          e.color
                        )}
                        onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                      >
                        <Icon className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{e.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} autres</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Vue Hebdomadaire ───
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={cn("py-3 text-center border-r border-border last:border-r-0", isToday && "bg-primary/5")}>
                <p className="text-xs text-muted-foreground">{DAYS_SHORT[d.getDay()]}</p>
                <p className={cn("text-lg font-semibold mt-0.5", isToday && "text-primary")}>{d.getDate()}</p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7">
          {weekDays.map((d, i) => {
            const dateStr = d.toISOString().split("T")[0];
            const dayEvents = events.filter((e) => {
              if (e.date === dateStr) return true;
              if (e.endDate) {
                const start = new Date(e.date).getTime();
                const end = new Date(e.endDate).getTime();
                const current = new Date(dateStr).getTime();
                return current >= start && current <= end;
              }
              return false;
            });

            return (
              <div key={i} className="min-h-[300px] border-r border-border last:border-r-0 p-2 space-y-1.5">
                {dayEvents.map((e) => {
                  const Icon = eventConfig[e.type].icon;
                  return (
                    <div
                      key={e.id}
                      className={cn("rounded-lg p-2 text-white cursor-pointer", e.color)}
                      onClick={() => setSelectedEvent(e)}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="text-[10px] font-medium truncate">{e.title}</span>
                      </div>
                      {e.time && <p className="text-[9px] opacity-80 mt-0.5">{e.time}{e.endTime ? ` → ${e.endTime}` : ""}</p>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Vue Journalière ───
  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayEvents = events
      .filter((e) => {
        if (e.date === dateStr) return true;
        if (e.endDate) {
          const start = new Date(e.date).getTime();
          const end = new Date(e.endDate).getTime();
          const current = new Date(dateStr).getTime();
          return current >= start && current <= end;
        }
        return false;
      })
      .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h3>
        </div>
        <div className="divide-y divide-border">
          {hours.map((h) => {
            const hourStr = String(h).padStart(2, "0") + ":00";
            const hourEvents = dayEvents.filter((e) => {
              if (!e.time) return false;
              const eventHour = parseInt(e.time.split(":")[0]);
              return eventHour === h;
            });

            return (
              <div key={h} className="flex items-start gap-3 p-3 min-h-[60px]">
                <span className="text-xs text-muted-foreground w-10 shrink-0 pt-0.5">{hourStr}</span>
                <div className="flex-1 space-y-1.5">
                  {hourEvents.map((e) => {
                    const Icon = eventConfig[e.type].icon;
                    const v = e.vehicleId ? vehicles.find((x) => x.id === e.vehicleId) : null;
                    return (
                      <div
                        key={e.id}
                        className={cn("flex items-center gap-3 rounded-lg p-3 text-white cursor-pointer", e.color)}
                        onClick={() => setSelectedEvent(e)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{e.title}</p>
                          <div className="flex items-center gap-3 text-xs opacity-80 mt-0.5">
                            {e.time && <span>{e.time}{e.endTime ? ` → ${e.endTime}` : ""}</span>}
                            {v && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{v.plate}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Calendrier">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8">

        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={goToPrev} className="rounded-lg border border-input bg-background p-2 hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {viewMode === "month" ? `${MONTHS[month]} ${year}` :
               viewMode === "week" ? `Semaine du ${currentDate.toLocaleDateString("fr-FR")}` :
               currentDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            <button onClick={goToNext} className="rounded-lg border border-input bg-background p-2 hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={goToToday} className="rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
              Aujourd'hui
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                showFilters ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtres
            </button>

            {/* Toggle vue */}
            <div className="flex rounded-lg border border-input bg-background p-0.5">
              {(["month", "week", "day"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    viewMode === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Filtres ─── */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4">
            {(Object.keys(eventConfig) as EventType[]).map((t) => {
              const cfg = eventConfig[t];
              const Icon = cfg.icon;
              const active = filterTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => {
                    setFilterTypes((prev) =>
                      active ? prev.filter((x) => x !== t) : [...prev, t]
                    );
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background text-muted-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Légende ─── */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Réservation</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-warning" />Maintenance</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive" />Document</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-purple-500" />État des lieux</span>
        </div>

        {/* ─── Calendrier ─── */}
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}

        {/* ─── Modal détail événement ─── */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedEvent(null)}>
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", selectedEvent.color)}>
                    {(() => {
                      const Icon = eventConfig[selectedEvent.type].icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                    <p className="text-sm text-muted-foreground">{eventConfig[selectedEvent.type].label}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(selectedEvent.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    {selectedEvent.endDate && ` → ${new Date(selectedEvent.endDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}`}
                  </span>
                </div>
                {selectedEvent.time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.time}{selectedEvent.endTime ? ` → ${selectedEvent.endTime}` : ""}</span>
                  </div>
                )}
                {selectedEvent.vehicleId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    {(() => {
                      const v = vehicles.find((x) => x.id === selectedEvent.vehicleId);
                      return v ? (
                        <Link to="/vehicles/$id" params={{ id: v.id }} className="hover:underline">
                          {v.brand} {v.model} ({v.plate})
                        </Link>
                      ) : (
                        <span>Véhicule inconnu</span>
                      );
                    })()}
                  </div>
                )}
                {selectedEvent.details && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    {selectedEvent.details}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setSelectedEvent(null)}>Fermer</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}