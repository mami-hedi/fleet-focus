import { useEffect, useState } from "react";
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
import type { Maintenance, Recurrence } from "@/lib/mock-data";
import { recurrenceLabels } from "@/lib/mock-data";

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
    status: "upcoming" as Maintenance["status"],
    recurrence: "none" as Recurrence,
  });

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId || !form.type || !form.garage) {
      toast.error("Véhicule, type et garage sont requis.");
      return;
    }
    addMaintenance(form);
    toast.success("Maintenance planifiée");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Maintenance["status"] }))}>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">Planifier</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
