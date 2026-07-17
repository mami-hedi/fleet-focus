import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useFleetStore } from "@/lib/store";

export const Route = createFileRoute("/vehicles")({
  component: VehiclesSection,
});

function VehiclesSection() {
  const fetchVehicles = useFleetStore((s) => s.fetchVehicles);
  const vehiclesLoaded = useFleetStore((s) => s.vehiclesLoaded);

  useEffect(() => {
    if (!vehiclesLoaded) fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Outlet />;
}

// avoid unused import warning if any
export { Link };