import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useFleetStore } from "@/lib/store";
import { recurrenceLabels } from "@/lib/mock-data";
// Types alignés sur le backend (maintenanceService), plus sur le mock local :
// une seule source de vérité pour "status"/"recurrence".
import type { MaintenanceStatus, RecurrenceType } from "@/lib/maintenanceService";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  vehicleId?: string;
}

export function MaintenanceDialog({ open, onOpenChange, vehicleId }: Props) {
  const vehicles = useFleetStore((s) => s.vehicles);
  const addMaintenance = useFleetStore((s) => s.addMaintenance);
  const [form, setForm] = useState({
    vehicleId: vehicleId ?? "",
    type: "",
    scheduledDate: new Date().toISOString().slice(0, 10),
    garage: "",
    status: "upcoming" as MaintenanceStatus,
    recurrence: "none" as RecurrenceType,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        vehicleId: vehicleId ?? "",
        type: "",
        scheduledDate: new Date().toISOString().slice(0, 10),
        garage: "",
        status: "upcoming",
        recurrence: "none",
      });
    }
  }, [open, vehicleId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId || !form.type || !form.garage) {
      toast.error("Véhicule, type et garage sont requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      // addMaintenance est async : le backend génère lui-même les occurrences
      // récurrentes et renvoie un tableau (1 élément si récurrence "none").
      const created = await addMaintenance(form);
      toast.success(
        created.length > 1
          ? `Maintenance planifiée — ${created.length} occurrences ajoutées`
          : "Maintenance planifiée",
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la planification de la maintenance.");
      // On laisse le dialog ouvert pour permettre de corriger et renvoyer.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Planifier une maintenance</DialogTitle>
          <DialogDescription>Ajoutez une intervention au calendrier du parc.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Véhicule</Label>
            <Select value={form.vehicleId} onValueChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Type d'intervention</Label>
            <Input value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="Ex : Vidange, Contrôle technique..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Date prévue</Label>
              <Input type="date" value={form.scheduledDate} onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as MaintenanceStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">À venir</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Garage</Label>
            <Input value={form.garage} onChange={(e) => setForm((f) => ({ ...f, garage: e.target.value }))} placeholder="Nom du garage" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Récurrence</Label>
            <Select value={form.recurrence} onValueChange={(v) => setForm((f) => ({ ...f, recurrence: v as RecurrenceType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(recurrenceLabels) as RecurrenceType[]).map((r) => (
                  <SelectItem key={r} value={r}>{recurrenceLabels[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.recurrence !== "none" && (
              <p className="text-[11px] text-muted-foreground">Les 4 prochaines occurrences seront ajoutées automatiquement au planning.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Planifier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}