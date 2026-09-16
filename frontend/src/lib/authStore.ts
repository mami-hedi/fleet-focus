// Store Zustand pour l'authentification admin
// Gère l'état global : utilisateur connecté, chargement, erreurs.
import { create } from "zustand";
import { authService, type AuthUser } from "./authService";

interface AuthState {
  // ─── État ───────────────────────────────────────────────────────────────
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean; // true pendant la vérif du token au démarrage
  isLoggingIn: boolean;
  loginError: string | null;

  // ─── Actions ────────────────────────────────────────────────────────────

  /**
   * À appeler une seule fois au démarrage de l'application.
   * Relit le token depuis localStorage et valide avec GET /api/auth/me.
   */
  initialize: () => Promise<void>;

  /**
   * Connexion admin : appelle POST /api/auth/login.
   * Retourne true si succès, false si échec.
   */
  login: (email: string, password: string) => Promise<boolean>;

  /**
   * Déconnexion : vide le store et le localStorage.
   */
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  isLoggingIn: false,
  loginError: null,

  initialize: async () => {
    // Lecture rapide depuis localStorage pour éviter un flash de la page login
    const stored = authService.getStoredUser();
    const token = authService.getToken();

    if (!token || !stored) {
      // Pas de session sauvegardée
      set({ isInitializing: false, isAuthenticated: false, user: null });
      return;
    }

    // Restauration optimiste depuis localStorage, puis validation réseau
    set({ user: stored, isAuthenticated: true });

    try {
      const me = await authService.fetchMe();
      if (me) {
        set({ user: me, isAuthenticated: true, isInitializing: false });
      } else {
        // Token expiré ou invalide
        set({ user: null, isAuthenticated: false, isInitializing: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isInitializing: false });
    }
  },

  login: async (email, password) => {
    set({ isLoggingIn: true, loginError: null });
    try {
      const user = await authService.login(email, password);
      set({ user, isAuthenticated: true, isLoggingIn: false, loginError: null });
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Identifiants invalides";
      set({ isLoggingIn: false, loginError: message, user: null, isAuthenticated: false });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, loginError: null });
  },
}));
