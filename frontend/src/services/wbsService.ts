import apiClient from './apiClient';
import {
  WbsElement,
  WbsChangeHistory,
  WbsType,
  WbsApprovalStatus,
  WorkflowRequest,
} from '../types/api';

export interface WbsFilters {
  projectId?: string;
  ownerId?: string;
  type?: WbsType;
  approvalStatus?: WbsApprovalStatus;
  includeHistory?: boolean;
}

export interface CreateWbsRequest {
  projectId: string;
  code: string;
  description: string;
  validFrom: string;
  validTo?: string;
  type: WbsType;
  ownerUserId?: string;
  approverUserId?: string;
}

export interface UpdateWbsRequest {
  code?: string;
  description?: string;
  validFrom?: string;
  validTo?: string;
  type?: WbsType;
  ownerUserId?: string;
  approverUserId?: string;
}

const wbsService = {
  // List WBS elements with optional filters
  async getWbsElements(filters?: WbsFilters): Promise<WbsElement[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.type !== undefined) params.append('type', filters.type.toString());
    if (filters?.approvalStatus !== undefined)
      params.append('approvalStatus', filters.approvalStatus.toString());
    if (filters?.includeHistory) params.append('includeHistory', 'true');

    const queryString = params.toString();
    const url = `/wbs${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<WbsElement[]>(url);
    return response.data;
  },

  // Get single WBS element by ID
  async getWbsElement(id: string): Promise<WbsElement> {
    const response = await apiClient.get<WbsElement>(`/wbs/${id}`);
    return response.data;
  },

  // Get WBS elements pending approval
  async getPendingApprovals(): Promise<WbsElement[]> {
    const response = await apiClient.get<WbsElement[]>('/wbs/pending-approval');
    return response.data;
  },

  // Get WBS change history
  async getWbsHistory(id: string): Promise<WbsChangeHistory[]> {
    const response = await apiClient.get<WbsChangeHistory[]>(`/wbs/${id}/history`);
    return response.data;
  },

  // Create new WBS element
  async createWbs(data: CreateWbsRequest): Promise<WbsElement> {
    const response = await apiClient.post<WbsElement>('/wbs', data);
    return response.data;
  },

  // Update WBS element
  async updateWbs(id: string, data: UpdateWbsRequest): Promise<WbsElement> {
    const response = await apiClient.put<WbsElement>(`/wbs/${id}`, data);
    return response.data;
  },

  // Submit WBS for approval
  async submitForApproval(id: string, request?: WorkflowRequest): Promise<void> {
    await apiClient.post(`/wbs/${id}/submit`, request || {});
  },

  // Approve WBS
  async approveWbs(id: string, request?: WorkflowRequest): Promise<void> {
    await apiClient.post(`/wbs/${id}/approve`, request || {});
  },

  // Reject WBS
  async rejectWbs(id: string, request: WorkflowRequest): Promise<void> {
    await apiClient.post(`/wbs/${id}/reject`, request);
  },

  // Suspend WBS
  async suspendWbs(id: string, request?: WorkflowRequest): Promise<void> {
    await apiClient.post(`/wbs/${id}/suspend`, request || {});
  },

  // Close WBS
  async closeWbs(id: string, request?: WorkflowRequest): Promise<void> {
    await apiClient.post(`/wbs/${id}/close`, request || {});
  },
};

export default wbsService;
