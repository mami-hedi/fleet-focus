import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UploadCloud, Camera } from "lucide-react";
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
import { vehicles } from "@/lib/mock-data";

export const Route = createFileRoute("/inspections/new")({
  head: () => ({ meta: [{ title: "Nouvel état des lieux — FleetOps" }] }),
  component: NewInspection,
});

const photoZones = [
  { key: "front", label: "Avant" },
  { key: "rear", label: "Arrière" },
  { key: "left", label: "Côté gauche" },
  { key: "right", label: "Côté droit" },
  { key: "interior", label: "Intérieur" },
  { key: "odometer", label: "Compteur km" },
];

const checklistItems = [
  { key: "tires", label: "Pneus en bon état" },
  { key: "exterior", label: "Propreté extérieure" },
  { key: "interior", label: "Propreté intérieure" },
  { key: "spare", label: "Roue de secours" },
  { key: "triangle", label: "Triangle de signalisation" },
  { key: "vest", label: "Gilet haute visibilité" },
];

function NewInspection() {
  const [fuel, setFuel] = useState([80]);

  return (
    <AppLayout title="Nouvel état des lieux">
      <form
        className="mx-auto flex max-w-4xl flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("État des lieux enregistré", { description: "Le rapport a été ajouté à la fiche du véhicule." });
        }}
      >
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Informations générales</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Véhicule</Label>
              <Select>
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
              <RadioGroup defaultValue="entree" className="mt-2 flex gap-4">
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
            {photoZones.map((z) => (
              <label key={z.key} className="group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center transition-colors hover:border-primary/50 hover:bg-accent/30">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground group-hover:text-primary">
                  <UploadCloud className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{z.label}</span>
                <span className="text-[10px] text-muted-foreground">JPG, PNG jusqu'à 10 Mo</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Checklist</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {checklistItems.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/30">
                <Checkbox id={c.key} defaultChecked />
                <span className="text-sm">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Relevés</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="km">Kilométrage</Label>
              <Input id="km" type="number" placeholder="Ex : 45 230" className="mt-1.5" />
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
            <Textarea id="notes" placeholder="Rayures, chocs, observations diverses..." className="mt-1.5" rows={4} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline">Annuler</Button>
          <Button type="submit" className="gap-1.5"><Camera className="h-4 w-4" /> Enregistrer l'état des lieux</Button>
        </div>
      </form>
    </AppLayout>
  );
}
