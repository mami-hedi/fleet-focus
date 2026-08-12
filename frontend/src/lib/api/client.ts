// Client HTTP générique pour les ressources utilisant le pattern hooks/@tanstack/react-query
// (ex: drivers). Même contrat que "@/lib/api-client" utilisé par vehicleService/documentService/
// maintenanceService, mais exposé sous un nom d'erreur différent ("ApiClientError") pour matcher
// ce que drivers.tsx importe déjà.
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

export class ApiClientError extends Error {
  status: number;
  errors?: ApiFieldError[];
  constructor(message: string, status: number, errors?: ApiFieldError[]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

function getToken(): string | null {
  return localStorage.getItem("fleetops_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "Impossible de joindre le serveur FleetOps. Vérifiez que l'API tourne bien sur " + API_BASE_URL,
      0,
    );
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) {
    const message = json?.message ?? `Erreur HTTP ${res.status}`;
    throw new ApiClientError(message, res.status, json?.errors);
  }
  return json as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};