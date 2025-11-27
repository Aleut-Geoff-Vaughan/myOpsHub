import { api } from '../lib/api-client';
import type { Office, CreateOfficeRequest, UpdateOfficeRequest } from '../types/api';
import { OfficeStatus } from '../types/api';

export interface GetOfficesParams {
  tenantId: string;
  status?: OfficeStatus;
  isClientSite?: boolean;
}

export const officesService = {
  async getAll(params: GetOfficesParams): Promise<Office[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('tenantId', params.tenantId);
    if (params.status !== undefined) searchParams.append('status', params.status.toString());
    if (params.isClientSite !== undefined) searchParams.append('isClientSite', params.isClientSite.toString());

    return api.get<Office[]>(`/offices?${searchParams.toString()}`);
  },

  async getById(id: string): Promise<Office> {
    return api.get<Office>(`/offices/${id}`);
  },

  async create(request: CreateOfficeRequest): Promise<Office> {
    return api.post<Office>('/offices', request);
  },

  async update(id: string, request: UpdateOfficeRequest): Promise<void> {
    return api.put<void>(`/offices/${id}`, request);
  },

  async delete(id: string): Promise<void> {
    return api.delete<void>(`/offices/${id}`);
  },
};
