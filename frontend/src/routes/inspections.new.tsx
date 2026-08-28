import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { UploadCloud, Camera, X, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useFleetStore } from "@/lib/store";
import type { InspectionChecklist, InspectionType } from "@/lib/inspectionService";

const searchSchema = z.object({ vehicleId: z.string().optional() });

export const Route = createFileRoute("/inspections/new")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Nouvel état des lieux — FleetOps" }] }),
  component: NewInspection,
});

// Aligné avec la limite du multer backend (upload.middleware.js : 5 Mo/fichier).
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const photoZones = [
  { key: "front", label: "Avant" },
  { key: "rear", label: "Arrière" },
  { key: "left", label: "Côté gauche" },
  { key: "right", label: "Côté droit" },
  { key: "interior", label: "Intérieur" },
  { key: "odometer", label: "Compteur km" },
] as const;

const checklistItems = [
  { key: "tires", label: "Pneus en bon état" },
  { key: "exteriorClean", label: "Propreté extérieure" },
  { key: "interiorClean", label: "Propreté intérieure" },
  { key: "spareWheel", label: "Roue de secours" },
  { key: "triangle", label: "Triangle de signalisation" },
  { key: "vest", label: "Gilet haute visibilité" },
] as const;

function NewInspection() {
  const { vehicleId: initialVehicleId } = Route.useSearch();
  const vehicles = useFleetStore((s) => s.vehicles);
  const addInspection = useFleetStore((s) => s.addInspection);
  const navigate = useNavigate();

  const [vehicleId, setVehicleId] = useState<string>(initialVehicleId ?? "");
  const [type, setType] = useState<InspectionType>("entree");
  const [mileage, setMileage] = useState<number>(0);
  const [fuel, setFuel] = useState([80]);
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<InspectionChecklist>({
    tires: true, exteriorClean: true, interiorClean: true, spareWheel: true, triangle: true, vest: true,
  });

  const [photos, setPhotos] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  const handlePhotoChange = (zoneKey: string, file: File | null) => {
    if (!file) {
      setPhotos((p) => ({ ...p, [zoneKey]: null }));
      setPreviews((p) => ({ ...p, [zoneKey]: null }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Format non supporté (JPG, PNG, WEBP uniquement).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`La photo "${file.name}" dépasse 5 Mo.`);
      return;
    }
    setPhotos((p) => ({ ...p, [zoneKey]: file }));
    const reader = new FileReader();
    reader.onload = (e) => setPreviews((p) => ({ ...p, [zoneKey]: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      toast.error("Sélectionnez un véhicule.");
      return;
    }
    if (!mileage || mileage <= 0) {
      toast.error("Indiquez un kilométrage valide.");
      return;
    }
    if (selectedVehicle && mileage < selectedVehicle.mileage) {
      toast.error(
        `Le kilométrage saisi (${mileage.toLocaleString("fr-FR")} km) est inférieur au dernier relevé connu (${selectedVehicle.mileage.toLocaleString("fr-FR")} km).`,
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await addInspection({
        vehicleId,
        type,
        date: new Date().toISOString().slice(0, 10),
        mileage,
        fuelLevel: fuel[0],
        notes: notes || null,
        checklist,
        photos: photoZones.map((z) => photos[z.key]).filter((f): f is File => !!f),
      });
      toast.success("État des lieux enregistré", { description: "Le rapport a été ajouté à la fiche du véhicule." });
      navigate({ to: "/vehicles/$id", params: { id: created.vehicleId } });
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de l'enregistrement de l'état des lieux.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="Nouvel état des lieux">
      <form className="mx-auto flex max-w-4xl flex-col gap-6" onSubmit={submit}>
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Informations générales</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Véhicule</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as InspectionType)} className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="entree" /> Entrée</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sortie" /> Sortie</label>
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Photos du véhicule</h2>
          <p className="mt-1 text-xs text-muted-foreground">Glissez-déposez ou cliquez pour ajouter une photo dans chaque zone.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photoZones.map((z) => {
              const preview = previews[z.key];
              return (
                <div key={z.key} className="relative">
                  <label className="group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center transition-colors hover:border-primary/50 hover:bg-accent/30">
                    {preview ? (
                      <img src={preview} alt={z.label} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground group-hover:text-primary">
                          <UploadCloud className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium">{z.label}</span>
                        <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP jusqu'à 5 Mo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(z.key, e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {preview && (
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/90 px-2 py-1">
                      <span className="truncate text-[10px] text-muted-foreground">{z.label}</span>
                      <button
                        type="button"
                        onClick={() => handlePhotoChange(z.key, null)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Checklist</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {checklistItems.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/30">
                <Checkbox
                  checked={checklist[c.key]}
                  onCheckedChange={(v) => setChecklist((cl) => ({ ...cl, [c.key]: !!v }))}
                />
                <span className="text-sm">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Relevés</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="km">
                Kilométrage
                {selectedVehicle && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    (dernier relevé : {selectedVehicle.mileage.toLocaleString("fr-FR")} km)
                  </span>
                )}
              </Label>
              <Input
                id="km"
                type="number"
                min={selectedVehicle?.mileage ?? 0}
                value={mileage || ""}
                onChange={(e) => setMileage(Number(e.target.value))}
                placeholder="Ex : 45 230"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Niveau de carburant</Label>
                <span className="text-sm font-semibold text-primary">{fuel[0]}%</span>
              </div>
              <Slider value={fuel} onValueChange={setFuel} min={0} max={100} step={5} className="mt-3" />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Vide</span><span>1/4</span><span>1/2</span><span>3/4</span><span>Plein</span>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Rayures, chocs, observations diverses..." className="mt-1.5" rows={4} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/vehicles" })} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" className="gap-1.5" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Enregistrer l'état des lieux
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}