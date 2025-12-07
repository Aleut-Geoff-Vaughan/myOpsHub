import { api } from '../lib/api-client';
import type {
  NonLaborCostType,
  NonLaborForecast,
  NonLaborBudgetLine,
  CreateCostTypeRequest,
  UpdateCostTypeRequest,
  UpsertNonLaborForecastRequest,
  UpsertBudgetLineRequest,
} from '../types/forecast';

export const nonLaborCostsService = {
  // Cost Types
  getCostTypes: async (includeInactive = false): Promise<NonLaborCostType[]> => {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    return api.get<NonLaborCostType[]>(`/non-labor-costs/types?${params.toString()}`);
  },

  getCostType: async (id: string): Promise<NonLaborCostType> => {
    return api.get<NonLaborCostType>(`/non-labor-costs/types/${id}`);
  },

  createCostType: async (request: CreateCostTypeRequest): Promise<NonLaborCostType> => {
    return api.post<NonLaborCostType>('/non-labor-costs/types', request);
  },

  updateCostType: async (id: string, request: UpdateCostTypeRequest): Promise<void> => {
    return api.put<void>(`/non-labor-costs/types/${id}`, request);
  },

  deleteCostType: async (id: string): Promise<void> => {
    return api.delete<void>(`/non-labor-costs/types/${id}`);
  },

  // Forecasts
  getForecasts: async (params: {
    projectId?: string;
    year?: number;
    month?: number;
  }): Promise<NonLaborForecast[]> => {
    const queryParams = new URLSearchParams();
    if (params.projectId) queryParams.append('projectId', params.projectId);
    if (params.year !== undefined) queryParams.append('year', params.year.toString());
    if (params.month !== undefined) queryParams.append('month', params.month.toString());
    return api.get<NonLaborForecast[]>(`/non-labor-costs/forecasts?${queryParams.toString()}`);
  },

  upsertForecast: async (request: UpsertNonLaborForecastRequest): Promise<NonLaborForecast> => {
    return api.post<NonLaborForecast>('/non-labor-costs/forecasts', request);
  },

  deleteForecast: async (id: string): Promise<void> => {
    return api.delete<void>(`/non-labor-costs/forecasts/${id}`);
  },

  // Budget Lines
  getBudgetLines: async (params: {
    budgetId?: string;
  }): Promise<NonLaborBudgetLine[]> => {
    const queryParams = new URLSearchParams();
    if (params.budgetId) queryParams.append('budgetId', params.budgetId);
    return api.get<NonLaborBudgetLine[]>(`/non-labor-costs/budget-lines?${queryParams.toString()}`);
  },

  upsertBudgetLine: async (request: UpsertBudgetLineRequest): Promise<NonLaborBudgetLine> => {
    return api.post<NonLaborBudgetLine>('/non-labor-costs/budget-lines', request);
  },
};
