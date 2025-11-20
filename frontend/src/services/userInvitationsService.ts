import { AppRole } from '../types/api';

const API_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

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
    const response = await fetch(`${API_URL}/api/user-invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create invitation');
    }

    return response.json();
  },

  // Get a specific invitation by ID
  async getInvitation(id: string): Promise<UserInvitation> {
    const response = await fetch(`${API_URL}/api/user-invitations/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch invitation');
    }

    return response.json();
  },

  // Get all pending invitations (optionally filtered by tenant)
  async getPendingInvitations(tenantId?: string): Promise<UserInvitation[]> {
    const url = tenantId
      ? `${API_URL}/api/user-invitations/pending?tenantId=${tenantId}`
      : `${API_URL}/api/user-invitations/pending`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch pending invitations');
    }

    return response.json();
  },

  // Cancel an invitation
  async cancelInvitation(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/user-invitations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to cancel invitation');
    }
  },

  // Resend an invitation email
  async resendInvitation(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/user-invitations/resend/${id}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to resend invitation');
    }

    return response.json();
  },
};
