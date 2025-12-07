import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nonLaborCostsService } from '../services/nonLaborCostsService';
import type {
  NonLaborCostType,
  NonLaborForecast,
  NonLaborBudgetLine,
  CreateCostTypeRequest,
  UpdateCostTypeRequest,
  UpsertNonLaborForecastRequest,
  UpsertBudgetLineRequest,
} from '../types/forecast';

// Cost Types
export function useNonLaborCostTypes(includeInactive = false) {
  return useQuery<NonLaborCostType[], Error>({
    queryKey: ['nonLaborCostTypes', includeInactive],
    queryFn: () => nonLaborCostsService.getCostTypes(includeInactive),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useNonLaborCostType(id: string) {
  return useQuery<NonLaborCostType, Error>({
    queryKey: ['nonLaborCostTypes', id],
    queryFn: () => nonLaborCostsService.getCostType(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCostType() {
  const queryClient = useQueryClient();
  return useMutation<NonLaborCostType, Error, CreateCostTypeRequest>({
    mutationFn: nonLaborCostsService.createCostType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonLaborCostTypes'] });
    },
  });
}

export function useUpdateCostType() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; request: UpdateCostTypeRequest }>({
    mutationFn: ({ id, request }) => nonLaborCostsService.updateCostType(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonLaborCostTypes'] });
    },
  });
}

export function useDeleteCostType() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: nonLaborCostsService.deleteCostType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonLaborCostTypes'] });
    },
  });
}

// Forecasts
export function useNonLaborForecasts(params: {
  projectId?: string;
  year?: number;
  month?: number;
}) {
  return useQuery<NonLaborForecast[], Error>({
    queryKey: ['nonLaborForecasts', params],
    queryFn: () => nonLaborCostsService.getForecasts(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!params.projectId || !!params.year,
  });
}

export function useUpsertNonLaborForecast() {
  const queryClient = useQueryClient();
  return useMutation<NonLaborForecast, Error, UpsertNonLaborForecastRequest>({
    mutationFn: nonLaborCostsService.upsertForecast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonLaborForecasts'] });
    },
  });
}

export function useDeleteNonLaborForecast() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: nonLaborCostsService.deleteForecast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonLaborForecasts'] });
    },
  });
}

// Budget Lines
export function useNonLaborBudgetLines(budgetId?: string) {
  return useQuery<NonLaborBudgetLine[], Error>({
    queryKey: ['nonLaborBudgetLines', budgetId],
    queryFn: () => nonLaborCostsService.getBudgetLines({ budgetId }),
    enabled: !!budgetId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpsertNonLaborBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation<NonLaborBudgetLine, Error, UpsertBudgetLineRequest>({
    mutationFn: nonLaborCostsService.upsertBudgetLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonLaborBudgetLines'] });
    },
  });
}
