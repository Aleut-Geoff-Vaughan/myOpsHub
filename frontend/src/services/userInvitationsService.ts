import { AppRole } from '../types/api';
import { api } from '../lib/api-client';

export enum InvitationStatus {
  Pending = 0,
  Accepted = 1,
  Cancelled = 2,
  Expired = 3,
}

export interface UserInvitation {
  id: string;
  email: string;
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
    status: string;
  };
  roles: AppRole[];
  invitationToken: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationRequest {
  email: string;
  tenantId: string;
  roles: AppRole[];
}

export const userInvitationsService = {
  // Create a new user invitation
  async createInvitation(request: CreateInvitationRequest): Promise<UserInvitation> {
    return api.post<UserInvitation>('/user-invitations', request);
  },

  // Get a specific invitation by ID
  async getInvitation(id: string): Promise<UserInvitation> {
    return api.get<UserInvitation>(`/user-invitations/${id}`);
  },

  // Get all pending invitations (optionally filtered by tenant)
  async getPendingInvitations(tenantId?: string): Promise<UserInvitation[]> {
    const url = tenantId
      ? `/user-invitations/pending?tenantId=${tenantId}`
      : `/user-invitations/pending`;
    return api.get<UserInvitation[]>(url);
  },

  // Cancel an invitation
  async cancelInvitation(id: string): Promise<void> {
    await api.delete<void>(`/user-invitations/${id}`);
  },

  // Resend an invitation email
  async resendInvitation(id: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/user-invitations/resend/${id}`);
  },
};
