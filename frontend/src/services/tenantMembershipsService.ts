import { AppRole } from '../types/api';
import { api } from '../lib/api-client';

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
    return api.get<RoleInfo[]>('/tenant-memberships/roles');
  },

  // Get a specific tenant membership
  async getTenantMembership(id: string) {
    return api.get(`/tenant-memberships/${id}`);
  },

  // Add user to tenant with roles
  async createTenantMembership(request: CreateTenantMembershipRequest) {
    return api.post('/tenant-memberships', request);
  },

  // Update roles for a tenant membership
  async updateRoles(membershipId: string, request: UpdateRolesRequest) {
    return api.put(`/tenant-memberships/${membershipId}/roles`, request);
  },

  // Update status (active/inactive) for a tenant membership
  async updateStatus(membershipId: string, request: UpdateStatusRequest) {
    return api.put(`/tenant-memberships/${membershipId}/status`, request);
  },

  // Remove user from tenant
  async deleteTenantMembership(membershipId: string) {
    return api.delete(`/tenant-memberships/${membershipId}`);
  },
};
