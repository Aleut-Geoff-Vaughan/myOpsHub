import { api } from '../lib/api-client';
import type {
  EmployeeCostRate,
  CostRateImportBatch,
  CreateCostRateRequest,
  UpdateCostRateRequest,
  ImportResultDto,
} from '../types/forecast';

export const costRatesService = {
  // Get all cost rates
  getCostRates: async (params: {
    userId?: string;
    includeInactive?: boolean;
    asOfDate?: string;
  }): Promise<EmployeeCostRate[]> => {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.includeInactive) queryParams.append('includeInactive', 'true');
    if (params.asOfDate) queryParams.append('asOfDate', params.asOfDate);
    return api.get<EmployeeCostRate[]>(`/cost-rates?${queryParams.toString()}`);
  },

  // Get effective rate for a user at a specific date
  getEffectiveRate: async (userId: string, asOfDate?: string): Promise<EmployeeCostRate> => {
    const queryParams = new URLSearchParams();
    if (asOfDate) queryParams.append('asOfDate', asOfDate);
    return api.get<EmployeeCostRate>(`/cost-rates/user/${userId}/effective?${queryParams.toString()}`);
  },

  // Get rate history for a user
  getRateHistory: async (userId: string): Promise<EmployeeCostRate[]> => {
    return api.get<EmployeeCostRate[]>(`/cost-rates/user/${userId}/history`);
  },

  // Create a new cost rate
  createCostRate: async (request: CreateCostRateRequest): Promise<EmployeeCostRate> => {
    return api.post<EmployeeCostRate>('/cost-rates', request);
  },

  // Update a cost rate
  updateCostRate: async (id: string, request: UpdateCostRateRequest): Promise<void> => {
    return api.put<void>(`/cost-rates/${id}`, request);
  },

  // Delete a cost rate
  deleteCostRate: async (id: string): Promise<void> => {
    return api.delete<void>(`/cost-rates/${id}`);
  },

  // Export cost rates to CSV
  exportCostRates: async (includeInactive = false): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (includeInactive) queryParams.append('includeInactive', 'true');
    const response = await fetch(`/api/cost-rates/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-Tenant-Id': localStorage.getItem('selectedTenantId') || '',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to export cost rates');
    }
    return response.blob();
  },

  // Import cost rates from CSV
  importCostRates: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/cost-rates/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-Tenant-Id': localStorage.getItem('selectedTenantId') || '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import cost rates');
    }

    return response.json();
  },

  // Get import history
  getImportHistory: async (): Promise<CostRateImportBatch[]> => {
    return api.get<CostRateImportBatch[]>('/cost-rates/import-history');
  },
};
