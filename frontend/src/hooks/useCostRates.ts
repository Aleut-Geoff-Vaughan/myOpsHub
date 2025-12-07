import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costRatesService } from '../services/costRatesService';
import type {
  EmployeeCostRate,
  CostRateImportBatch,
  CreateCostRateRequest,
  UpdateCostRateRequest,
  ImportResultDto,
} from '../types/forecast';

// Get all cost rates
export function useCostRates(params: {
  userId?: string;
  includeInactive?: boolean;
  asOfDate?: string;
} = {}) {
  return useQuery<EmployeeCostRate[], Error>({
    queryKey: ['costRates', params],
    queryFn: () => costRatesService.getCostRates(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Get effective rate for a user
export function useEffectiveCostRate(userId: string, asOfDate?: string) {
  return useQuery<EmployeeCostRate, Error>({
    queryKey: ['costRates', 'effective', userId, asOfDate],
    queryFn: () => costRatesService.getEffectiveRate(userId, asOfDate),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Get rate history for a user
export function useCostRateHistory(userId: string) {
  return useQuery<EmployeeCostRate[], Error>({
    queryKey: ['costRates', 'history', userId],
    queryFn: () => costRatesService.getRateHistory(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Create cost rate
export function useCreateCostRate() {
  const queryClient = useQueryClient();
  return useMutation<EmployeeCostRate, Error, CreateCostRateRequest>({
    mutationFn: costRatesService.createCostRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costRates'] });
    },
  });
}

// Update cost rate
export function useUpdateCostRate() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; request: UpdateCostRateRequest }>({
    mutationFn: ({ id, request }) => costRatesService.updateCostRate(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costRates'] });
    },
  });
}

// Delete cost rate
export function useDeleteCostRate() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: costRatesService.deleteCostRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costRates'] });
    },
  });
}

// Import cost rates
export function useImportCostRates() {
  const queryClient = useQueryClient();
  return useMutation<ImportResultDto, Error, File>({
    mutationFn: costRatesService.importCostRates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costRates'] });
      queryClient.invalidateQueries({ queryKey: ['costRateImportHistory'] });
    },
  });
}

// Get import history
export function useCostRateImportHistory() {
  return useQuery<CostRateImportBatch[], Error>({
    queryKey: ['costRateImportHistory'],
    queryFn: costRatesService.getImportHistory,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Export cost rates - returns a download function
export function useExportCostRates() {
  return useMutation<void, Error, { includeInactive?: boolean }>({
    mutationFn: async ({ includeInactive = false }) => {
      const blob = await costRatesService.exportCostRates(includeInactive);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-rates-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}
