import { AppRole } from '../types/api';

const API_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

export type RoleInfo = {
  value: AppRole;
  name: string;
  description: string;
  level: 'tenant' | 'system';
};

export type CreateTenantMembershipRequest = {
  userId: string;
  tenantId: string;
  roles: AppRole[];
};

export type UpdateRolesRequest = {
  roles: AppRole[];
};

export type UpdateStatusRequest = {
  isActive: boolean;
};

export const tenantMembershipsService = {
  // Get available roles with descriptions
  async getRoles(): Promise<RoleInfo[]> {
    const response = await fetch(`${API_URL}/api/tenant-memberships/roles`);
    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }
    return response.json();
  },

  // Get a specific tenant membership
  async getTenantMembership(id: string) {
    const response = await fetch(`${API_URL}/api/tenant-memberships/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tenant membership');
    }
    return response.json();
  },

  // Add user to tenant with roles
  async createTenantMembership(request: CreateTenantMembershipRequest) {
    const response = await fetch(`${API_URL}/api/tenant-memberships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create tenant membership');
    }
    return response.json();
  },

  // Update roles for a tenant membership
  async updateRoles(membershipId: string, request: UpdateRolesRequest) {
    const response = await fetch(`${API_URL}/api/tenant-memberships/${membershipId}/roles`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update roles');
    }
    return response.json();
  },

  // Update status (active/inactive) for a tenant membership
  async updateStatus(membershipId: string, request: UpdateStatusRequest) {
    const response = await fetch(`${API_URL}/api/tenant-memberships/${membershipId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update status');
    }
    return response.json();
  },

  // Remove user from tenant
  async deleteTenantMembership(membershipId: string) {
    const response = await fetch(`${API_URL}/api/tenant-memberships/${membershipId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete tenant membership');
    }
  },
};
