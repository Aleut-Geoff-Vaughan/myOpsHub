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

export interface InvitationResponse {
  invitation: UserInvitation;
  invitationUrl: string;
  emailSubject: string;
  emailHtmlBody: string;
  emailPlainTextBody: string;
}

export interface ResendInvitationResponse {
  message: string;
  invitationUrl: string;
  emailSubject: string;
  emailHtmlBody: string;
  emailPlainTextBody: string;
}

export interface CreateUserDirectRequest {
  email: string;
  displayName?: string;
  tenantId: string;
  roles: AppRole[];
  password?: string;
}

export interface DirectUserCreationResponse {
  success: boolean;
  message: string;
  userId: string;
  email: string;
  displayName: string;
  tenantId: string;
  tenantName: string;
  roles: AppRole[];
  hasPassword: boolean;
  setPasswordUrl?: string;
  setPasswordEmailContent?: string;
}

export interface InvitationEmailContentResponse {
  invitationId: string;
  email: string;
  tenantName: string;
  invitationUrl: string;
  expiresAt: string;
  emailSubject: string;
  emailHtmlBody: string;
  emailPlainTextBody: string;
}

export const userInvitationsService = {
  // Create a new user invitation - returns email content for manual sending
  async createInvitation(request: CreateInvitationRequest): Promise<InvitationResponse> {
    return api.post<InvitationResponse>('/user-invitations', request);
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

  // Resend an invitation email - returns email content for manual sending
  async resendInvitation(id: string): Promise<ResendInvitationResponse> {
    return api.post<ResendInvitationResponse>(`/user-invitations/resend/${id}`);
  },

  // Get email content for an existing invitation
  async getInvitationEmailContent(id: string): Promise<InvitationEmailContentResponse> {
    return api.get<InvitationEmailContentResponse>(`/user-invitations/${id}/email-content`);
  },

  // Create user directly without email notification
  async createUserDirect(request: CreateUserDirectRequest): Promise<DirectUserCreationResponse> {
    return api.post<DirectUserCreationResponse>('/user-invitations/create-user-direct', request);
  },
};
