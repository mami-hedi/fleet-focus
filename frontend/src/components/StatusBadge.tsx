import { statusLabels, type VehicleStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const styles: Record<VehicleStatus, string> = {
  available: "bg-success/15 text-success border-success/20",
  rented: "bg-info/15 text-info border-info/20",
  maintenance: "bg-warning/20 text-warning-foreground border-warning/30",
  out_of_service: "bg-destructive/15 text-destructive border-destructive/20",
};

export function StatusBadge({ status, className }: { status: VehicleStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}
