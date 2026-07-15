import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2, Mail, Phone, MapPin, Receipt, Save, RotateCcw,
  Palette, Moon, Sun, Monitor, Globe, Bell, BellOff,
  Upload, X, CheckCircle2, AlertTriangle
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Paramètres — FleetOps" }] }),
  component: SettingsPage,
});

interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  siret: string;
  tva: string;
  logo?: string;
}

interface AppSettings {
  theme: "light" | "dark" | "system";
  language: "fr" | "en";
  emailAlerts: boolean;
  alertDaysBefore: number;
}

const defaultCompany: CompanySettings = {
  name: "MH Digital Solution",
  email: "contact@mhdigital.tn",
  phone: "+216 71 123 456",
  address: "Tunis, Tunisie",
  siret: "12345678901234",
  tva: "FR12345678901",
};

const defaultApp: AppSettings = {
  theme: "light",
  language: "fr",
  emailAlerts: true,
  alertDaysBefore: 30,
};

function SettingsPage() {
  const [company, setCompany] = useState<CompanySettings>(defaultCompany);
  const [app, setApp] = useState<AppSettings>(defaultApp);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"company" | "app">("company");

  const handleSave = () => {
    // Ici : appel API pour persister
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setCompany(defaultCompany);
    setApp(defaultApp);
  };

  const hasChanges =
    JSON.stringify(company) !== JSON.stringify(defaultCompany) ||
    JSON.stringify(app) !== JSON.stringify(defaultApp);

  return (
    <AppLayout title="Paramètres">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 sm:px-6 lg:px-8">

        {/* ─── Tabs ─── */}
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 w-fit">
          <TabButton active={activeTab === "company"} onClick={() => setActiveTab("company")} icon={Building2} label="Entreprise" />
          <TabButton active={activeTab === "app"} onClick={() => setActiveTab("app")} icon={Palette} label="Application" />
        </div>

        {/* ─── Contenu ─── */}
        {activeTab === "company" ? (
          <CompanyTab company={company} onChange={setCompany} />
        ) : (
          <AppTab app={app} onChange={setApp} />
        )}

        {/* ─── Actions ─── */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" />
            Enregistrer
          </Button>
        </div>

        {/* ─── Toast de confirmation ─── */}
        {saved && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-success px-4 py-3 text-sm font-medium text-success-foreground shadow-lg animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="h-4 w-4" />
            Paramètres enregistrés avec succès
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ONGLET ENTREPRISE
   ═══════════════════════════════════════════════════════════════ */

function CompanyTab({
  company,
  onChange,
}: {
  company: CompanySettings;
  onChange: (c: CompanySettings) => void;
}) {
  const [logoPreview, setLogoPreview] = useState<string | null>(company.logo ?? null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        onChange({ ...company, logo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const update = (field: keyof CompanySettings, value: string) => {
    onChange({ ...company, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Section title="Logo de l'entreprise" icon={Upload}>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className={cn(
            "relative flex items-center gap-4 rounded-xl border-2 border-dashed p-6 transition-colors",
            isDragging ? "border-primary bg-primary/5" : logoPreview ? "border-success bg-success/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          {logoPreview ? (
            <div className="flex items-center gap-4">
              <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg object-contain border bg-white" />
              <div>
                <p className="text-sm font-medium">Logo actuel</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLogoPreview(null); onChange({ ...company, logo: undefined }); }}
                  className="text-xs text-destructive hover:underline mt-1"
                >
                  Supprimer le logo
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Importer un logo</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, SVG — max 2 Mo</p>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Informations */}
      <Section title="Informations générales" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom de l'entreprise" value={company.name} onChange={(v) => update("name", v)} icon={Building2} />
          <Field label="Email" value={company.email} onChange={(v) => update("email", v)} icon={Mail} type="email" />
          <Field label="Téléphone" value={company.phone} onChange={(v) => update("phone", v)} icon={Phone} />
          <Field label="Adresse" value={company.address} onChange={(v) => update("address", v)} icon={MapPin} />
        </div>
      </Section>

      {/* Fiscal */}
      <Section title="Informations fiscales" icon={Receipt}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Numéro SIRET" value={company.siret} onChange={(v) => update("siret", v)} icon={Receipt} />
          <Field label="Numéro TVA" value={company.tva} onChange={(v) => update("tva", v)} icon={Receipt} />
        </div>
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ONGLET APPLICATION
   ═══════════════════════════════════════════════════════════════ */

function AppTab({
  app,
  onChange,
}: {
  app: AppSettings;
  onChange: (a: AppSettings) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Thème */}
      <Section title="Apparence" icon={Palette}>
        <div className="grid grid-cols-3 gap-3">
          <ThemeCard
            icon={Sun}
            label="Clair"
            active={app.theme === "light"}
            onClick={() => onChange({ ...app, theme: "light" })}
          />
          <ThemeCard
            icon={Moon}
            label="Sombre"
            active={app.theme === "dark"}
            onClick={() => onChange({ ...app, theme: "dark" })}
          />
          <ThemeCard
            icon={Monitor}
            label="Système"
            active={app.theme === "system"}
            onClick={() => onChange({ ...app, theme: "system" })}
          />
        </div>
      </Section>

      {/* Langue */}
      <Section title="Langue" icon={Globe}>
        <div className="flex gap-2">
          <LangButton active={app.language === "fr"} onClick={() => onChange({ ...app, language: "fr" })} label="Français" />
          <LangButton active={app.language === "en"} onClick={() => onChange({ ...app, language: "en" })} label="English" />
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              {app.emailAlerts ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">Alertes par email</p>
                <p className="text-xs text-muted-foreground">Recevoir un email avant expiration des documents</p>
              </div>
            </div>
            <button
              onClick={() => onChange({ ...app, emailAlerts: !app.emailAlerts })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                app.emailAlerts ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  app.emailAlerts ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>

          {app.emailAlerts && (
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="block text-sm font-medium mb-2">
                <AlertTriangle className="h-4 w-4 inline mr-1.5 text-warning" />
                Jours avant alerte
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={7}
                  max={90}
                  step={1}
                  value={app.alertDaysBefore}
                  onChange={(e) => onChange({ ...app, alertDaysBefore: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{app.alertDaysBefore}j</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Vous serez alerté {app.alertDaysBefore} jours avant l'expiration d'un document
              </p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ═══════════════════════════════════════════════════════════════ */

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}

function ThemeCard({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function LangButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "border border-input bg-background text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}