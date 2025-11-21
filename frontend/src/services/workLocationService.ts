import { api } from '../lib/api-client';
import type { WorkLocationPreference } from '../types/api';

export const workLocationService = {
  getAll: async (params?: {
    personId?: string;
    startDate?: string;
    endDate?: string;
    locationType?: number;
  }): Promise<WorkLocationPreference[]> => {
    const queryParams = new URLSearchParams();
    if (params?.personId) queryParams.append('personId', params.personId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.locationType !== undefined) queryParams.append('locationType', params.locationType.toString());

    const query = queryParams.toString();
    return api.get<WorkLocationPreference[]>(`/worklocationpreferences${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<WorkLocationPreference> => {
    return api.get<WorkLocationPreference>(`/worklocationpreferences/${id}`);
  },

  create: async (
    preference: Omit<WorkLocationPreference, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkLocationPreference> => {
    return api.post<WorkLocationPreference>('/worklocationpreferences', preference);
  },

  update: async (
    id: string,
    preference: WorkLocationPreference
  ): Promise<void> => {
    return api.put<void>(`/worklocationpreferences/${id}`, preference);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/worklocationpreferences/${id}`);
  },

  createBulk: async (
    preferences: Omit<WorkLocationPreference, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<WorkLocationPreference[]> => {
    return api.post<WorkLocationPreference[]>('/worklocationpreferences/bulk', preferences);
  },
};
