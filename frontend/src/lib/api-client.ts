// Client HTTP générique pour l'API FleetOps (backend Express).
// Le backend répond toujours avec l'enveloppe { success, message, data, meta? }
// ou, en cas d'erreur, { success: false, message, errors? } (voir error.middleware.js).

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiFieldError {
  field?: string;
  message: string;
  [key: string]: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  errors?: ApiFieldError[];

  constructor(message: string, status: number, errors?: ApiFieldError[]) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
  }

  // Concatène les messages d'erreurs de champ (express-validator / Sequelize)
  // en un texte lisible pour un toast.
  get detail(): string {
    if (!this.errors?.length) return this.message;
    return this.errors.map((e) => e.message).join(" · ");
  }
}

function getToken(): string | null {
  // NOTE: l'authentification est actuellement désactivée côté backend sur
  // /api/vehicles (dev only). Ce helper reste prêt pour quand le login
  // sera branché : il suffira de stocker le token ici après /api/auth/login.
  return localStorage.getItem("fleetops_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiRequestError(
      "Impossible de joindre le serveur FleetOps. Vérifiez que l'API tourne bien sur " + API_BASE_URL,
      0,
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.success === false) {
    const message = json?.message ?? `Erreur HTTP ${res.status}`;
    throw new ApiRequestError(message, res.status, json?.errors);
  }

  return json as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};