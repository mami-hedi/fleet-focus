import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClipboardCheck, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Connexion — FleetOps" }],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, loginError, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  // Si déjà connecté, rediriger directement
  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const success = await login(values.email, values.password);
    if (success) {
      void navigate({ to: "/" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* ─── Logo / En-tête ─── */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">MH FleetOps</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestion de parc automobile
            </p>
          </div>
        </div>

        {/* ─── Carte formulaire ─── */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-card-foreground">
            Connexion administrateur
          </h2>
          <p className="mb-6 text-xs text-muted-foreground">
            Entrez vos identifiants pour accéder au tableau de bord.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@mhdigital.tn"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Erreur de connexion (backend) */}
            {loginError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {loginError}
              </div>
            )}

            {/* Bouton de connexion */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Connexion en cours…" : "Se connecter"}
            </Button>
          </form>
        </div>

        {/* ─── Footer ─── */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <span className="font-medium text-foreground">MH Digital Solution</span>
        </p>
      </div>
    </div>
  );
}
