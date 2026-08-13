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
import type { MaintenanceStatus, RecurrenceType, MaintenanceDTO } from "@/lib/maintenanceService";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  vehicleId?: string;
  // Présent => mode édition. Absent/undefined => mode création.
  maintenance?: MaintenanceDTO | null;
}

interface FormState {
  vehicleId: string;
  type: string;
  scheduledDate: string;
  garage: string;
  status: MaintenanceStatus;
  recurrence: RecurrenceType;
  completedDate: string;
  cost: string;
}

function emptyForm(vehicleId?: string): FormState {
  return {
    vehicleId: vehicleId ?? "",
    type: "",
    scheduledDate: new Date().toISOString().slice(0, 10),
    garage: "",
    status: "upcoming",
    recurrence: "none",
    completedDate: "",
    cost: "",
  };
}

function formFromMaintenance(m: MaintenanceDTO): FormState {
  return {
    vehicleId: m.vehicleId,
    type: m.type,
    scheduledDate: m.scheduledDate?.slice(0, 10) ?? "",
    garage: m.garage,
    status: m.status,
    recurrence: m.recurrence,
    completedDate: m.completedDate ? m.completedDate.slice(0, 10) : "",
    cost: m.cost !== null && m.cost !== undefined ? String(m.cost) : "",
  };
}

export function MaintenanceDialog({ open, onOpenChange, vehicleId, maintenance }: Props) {
  const vehicles = useFleetStore((s) => s.vehicles);
  const addMaintenance = useFleetStore((s) => s.addMaintenance);
  const editMaintenance = useFleetStore((s) => s.editMaintenance);
  const isEdit = !!maintenance;

  const [form, setForm] = useState<FormState>(emptyForm(vehicleId));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(maintenance ? formFromMaintenance(maintenance) : emptyForm(vehicleId));
    }
    // maintenance est réévalué à chaque ouverture ; pas besoin de le suivre en continu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicleId, maintenance?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId || !form.type || !form.garage) {
      toast.error("Véhicule, type et garage sont requis.");
      return;
    }

    const payload = {
      vehicleId: form.vehicleId,
      type: form.type,
      scheduledDate: form.scheduledDate,
      garage: form.garage,
      status: form.status,
      recurrence: form.recurrence,
      completedDate: form.status === "completed" ? form.completedDate || new Date().toISOString().slice(0, 10) : null,
      cost: form.cost !== "" ? Number(form.cost) : null,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && maintenance) {
        await editMaintenance(maintenance.id, payload);
        toast.success("Maintenance mise à jour");
      } else {
        // addMaintenance est async : le backend génère lui-même les occurrences
        // récurrentes et renvoie un tableau (1 élément si récurrence "none").
        const created = await addMaintenance(payload);
        toast.success(
          created.length > 1
            ? `Maintenance planifiée — ${created.length} occurrences ajoutées`
            : "Maintenance planifiée",
        );
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'enregistrement de la maintenance.");
      // On laisse le dialog ouvert pour permettre de corriger et renvoyer.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la maintenance" : "Planifier une maintenance"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Mettez à jour les informations de cette intervention." : "Ajoutez une intervention au calendrier du parc."}
          </DialogDescription>
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

          {form.status === "completed" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Date de réalisation</Label>
                <Input
                  type="date"
                  value={form.completedDate}
                  onChange={(e) => setForm((f) => ({ ...f, completedDate: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Coût (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                  placeholder="150.00"
                />
              </div>
            </div>
          )}

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
            {!isEdit && form.recurrence !== "none" && (
              <p className="text-[11px] text-muted-foreground">Les 4 prochaines occurrences seront ajoutées automatiquement au planning.</p>
            )}
            {isEdit && maintenance?.seriesId && (
              <p className="text-[11px] text-muted-foreground">
                Cette maintenance fait partie d'une série récurrente. Modifier ce champ ne change que cette occurrence.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Planifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}