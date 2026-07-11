import { Link } from "@tanstack/react-router";
import { Fuel, Gauge } from "lucide-react";
import { fuelLabels, type Vehicle } from "@/lib/mock-data";
import { StatusBadge } from "./StatusBadge";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      to="/vehicles/$id"
      params={{ id: vehicle.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3">
          <StatusBadge status={vehicle.status} className="bg-background/90 backdrop-blur" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-semibold text-foreground">
              {vehicle.brand} {vehicle.model}
            </h3>
            <span className="text-xs text-muted-foreground">{vehicle.year}</span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{vehicle.plate}</p>
        </div>
        <div className="mt-auto flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" />
            {vehicle.mileage.toLocaleString("fr-FR")} km
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5" />
            {fuelLabels[vehicle.fuel]}
          </span>
        </div>
      </div>
    </Link>
  );
}
