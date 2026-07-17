import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
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
import { ApiRequestError } from "@/lib/api-client";
import { VehicleImage } from "@/components/VehicleImage";

// Convertit un fichier image sélectionné en data URL valide
// (avec le préfixe "data:image/...;base64," requis pour un <img src>).
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

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
  const [submitting, setSubmitting] = useState(false);

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

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de resélectionner le même fichier ensuite
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      set("image", dataUrl);
    } catch {
      toast.error("Impossible de charger cette image");
    }
  };

  const handlePhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    try {
      const dataUrls = await Promise.all(files.map(fileToDataUrl));
      set("photos", [...(form.photos ?? []), ...dataUrls]);
    } catch {
      toast.error("Impossible de charger une ou plusieurs photos");
    }
  };

  const removePhoto = (index: number) =>
    set("photos", (form.photos ?? []).filter((_, i) => i !== index));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.plate || !form.vin) {
      toast.error("Marque, modèle, immatriculation et VIN sont requis.");
      return;
    }
    setSubmitting(true);
    try {
      if (vehicle) {
        await updateVehicle(vehicle.id, form);
        toast.success("Véhicule mis à jour");
      } else {
        await addVehicle(form);
        toast.success("Véhicule ajouté au parc");
      }
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.detail : (err as Error).message;
      toast.error(message || "Erreur lors de l'enregistrement du véhicule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{vehicle ? "Modifier le véhicule" : "Ajouter un véhicule"}</DialogTitle>
          <DialogDescription>
            {vehicle ? "Mettez à jour les informations du véhicule." : "Enregistrez un nouveau véhicule dans le parc."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-4 sm:grid-cols-2">
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
            <Field label="Image de couverture">
              <div className="flex items-center gap-3">
                <VehicleImage
                  src={form.image}
                  alt=""
                  className="h-16 w-24 shrink-0 rounded-md border border-border object-cover"
                  iconClassName="h-5 w-5"
                />
                <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Choisir une image
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
                </label>
              </div>
              <Input
                value={form.image ?? ""}
                onChange={(e) => set("image", e.target.value)}
                placeholder="ou collez une URL d'image..."
                className="mt-2 text-xs"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Photos supplémentaires">
              <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                <ImagePlus className="h-3.5 w-3.5" />
                Ajouter des photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoFiles} />
              </label>
            </Field>
            {(form.photos ?? []).length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {(form.photos ?? []).map((p, i) => (
                  <div key={i} className="relative shrink-0">
                    <VehicleImage src={p} alt="" className="h-16 w-24 rounded-md border border-border object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Annuler</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : vehicle ? "Enregistrer" : "Ajouter"}
            </Button>
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