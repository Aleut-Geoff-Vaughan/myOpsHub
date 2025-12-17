import { api } from '../lib/api-client';
import type { ProjectAssignment } from '../types/api';
import { ProjectAssignmentStatus } from '../types/api';

export interface GetProjectAssignmentsParams {
  tenantId?: string;
  userId?: string;
  projectId?: string;
  status?: ProjectAssignmentStatus;
}

export interface UpdateProjectAssignmentRequest {
  id: string;
  userId: string;
  projectId: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export const projectAssignmentsService = {
  async getAll(params?: GetProjectAssignmentsParams): Promise<ProjectAssignment[]> {
    const searchParams = new URLSearchParams();

    if (params?.tenantId) searchParams.append('tenantId', params.tenantId);
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.projectId) searchParams.append('projectId', params.projectId);
    if (params?.status !== undefined) searchParams.append('status', params.status.toString());

    const query = searchParams.toString();
    return api.get<ProjectAssignment[]>(`/projectassignments${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<ProjectAssignment> {
    return api.get<ProjectAssignment>(`/projectassignments/${id}`);
  },

  async create(projectAssignment: Omit<ProjectAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectAssignment> {
    return api.post<ProjectAssignment>('/projectassignments', projectAssignment);
  },

  async update(id: string, request: UpdateProjectAssignmentRequest): Promise<void> {
    return api.put<void>(`/projectassignments/${id}`, request);
  },

  async delete(id: string, reason?: string): Promise<void> {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return api.delete<void>(`/projectassignments/${id}${query}`);
  },

  async restore(id: string): Promise<ProjectAssignment> {
    return api.post<ProjectAssignment>(`/projectassignments/${id}/restore`);
  },

  async approve(id: string): Promise<ProjectAssignment> {
    return api.post<ProjectAssignment>(`/projectassignments/${id}/approve`);
  },
};
