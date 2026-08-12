import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { driversApi, type DriverListParams, type DriverInput } from "@/lib/api/drivers";

const DRIVERS_KEY = ["drivers"] as const;

export function useDrivers(params: DriverListParams) {
  return useQuery({
    queryKey: [...DRIVERS_KEY, params],
    queryFn: () => driversApi.list(params),
    // Garde les données de la page précédente affichées pendant le chargement de la nouvelle
    // page/filtre, au lieu de vider la liste (cohérent avec l'usage de "isFetching" dans drivers.tsx).
    placeholderData: keepPreviousData,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DriverInput) => driversApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<DriverInput> }) =>
      driversApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => driversApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });
    },
  });
}