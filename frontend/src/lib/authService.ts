// Service d'authentification — appelle POST /api/auth/login et GET /api/auth/me
import { apiClient, type ApiEnvelope } from "./api-client";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  isActive: boolean;
  createdAt: string;
}

interface LoginResponse {
  user: AuthUser;
  token: string;
}

const TOKEN_KEY = "fleetops_token";
const USER_KEY = "fleetops_user";

export const authService = {
  /**
   * Connexion admin : POST /api/auth/login
   * Stocke le token et le profil dans localStorage pour persister la session.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await apiClient.post<ApiEnvelope<LoginResponse>>("/auth/login", {
      email,
      password,
    });
    const { token, user } = res.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Déconnexion : vide le localStorage.
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Relit le token depuis localStorage (pour restaurer la session au démarrage).
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Relit le profil utilisateur sauvegardé localement.
   */
  getStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },

  /**
   * Vérifie la validité du token en appellant GET /api/auth/me.
   * Retourne null si le token est absent, invalide ou expiré.
   */
  async fetchMe(): Promise<AuthUser | null> {
    const token = authService.getToken();
    if (!token) return null;
    try {
      const res = await apiClient.get<ApiEnvelope<AuthUser>>("/auth/me");
      return res.data;
    } catch {
      // Token expiré ou invalide — on nettoie
      authService.logout();
      return null;
    }
  },
};
