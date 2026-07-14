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
import type { FuelType, Vehicle, VehicleStatus } from "@/lib/mock-data";
import { fuelLabels, statusLabels } from "@/lib/mock-data";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  vehicle?: Vehicle | null;
}

const empty: Omit<Vehicle, "id"> = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  plate: "",
  vin: "",
  color: "",
  transmission: "manuelle",
  fuel: "essence",
  mileage: 0,
  status: "available",
  image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=70",
  photos: [],
};

export function VehicleFormDialog({ open, onOpenChange, vehicle }: Props) {
  const addVehicle = useFleetStore((s) => s.addVehicle);
  const updateVehicle = useFleetStore((s) => s.updateVehicle);
  const [form, setForm] = useState<Omit<Vehicle, "id">>(empty);

  useEffect(() => {
    if (open) {
      if (vehicle) {
        const { id: _id, ...rest } = vehicle;
        setForm({ ...empty, ...rest, photos: rest.photos ?? [] });
      } else setForm(empty);
    }
  }, [open, vehicle]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.plate) {
      toast.error("Marque, modèle et immatriculation sont requis.");
      return;
    }
    if (vehicle) {
      updateVehicle(vehicle.id, form);
      toast.success("Véhicule mis à jour");
    } else {
      addVehicle(form);
      toast.success("Véhicule ajouté au parc");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Modifier le véhicule" : "Ajouter un véhicule"}</DialogTitle>
          <DialogDescription>
            {vehicle ? "Mettez à jour les informations du véhicule." : "Enregistrez un nouveau véhicule dans le parc."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Marque"><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
          <Field label="Modèle"><Input value={form.model} onChange={(e) => set("model", e.target.value)} /></Field>
          <Field label="Année"><Input type="number" value={form.year} onChange={(e) => set("year", Number(e.target.value))} /></Field>
          <Field label="Immatriculation"><Input value={form.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} className="font-mono" /></Field>
          <Field label="VIN"><Input value={form.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} className="font-mono" /></Field>
          <Field label="Couleur"><Input value={form.color} onChange={(e) => set("color", e.target.value)} /></Field>
          <Field label="Kilométrage"><Input type="number" value={form.mileage} onChange={(e) => set("mileage", Number(e.target.value))} /></Field>
          <Field label="Boîte">
            <Select value={form.transmission} onValueChange={(v) => set("transmission", v as Vehicle["transmission"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manuelle">Manuelle</SelectItem>
                <SelectItem value="automatique">Automatique</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Carburant">
            <Select value={form.fuel} onValueChange={(v) => set("fuel", v as FuelType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(fuelLabels) as FuelType[]).map((f) => (
                  <SelectItem key={f} value={f}>{fuelLabels[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Statut">
            <Select value={form.status} onValueChange={(v) => set("status", v as VehicleStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(statusLabels) as VehicleStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Image de couverture (URL)"><Input value={form.image} onChange={(e) => set("image", e.target.value)} /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Photos supplémentaires (une URL par ligne)">
              <textarea
                value={(form.photos ?? []).join("\n")}
                onChange={(e) =>
                  set(
                    "photos",
                    e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                  )
                }
                rows={3}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="https://.../photo1.jpg&#10;https://.../photo2.jpg"
              />
            </Field>
            {(form.photos ?? []).length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {(form.photos ?? []).map((p, i) => (
                  <img key={i} src={p} alt="" className="h-16 w-24 shrink-0 rounded-md border border-border object-cover" />
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{vehicle ? "Enregistrer" : "Ajouter"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
