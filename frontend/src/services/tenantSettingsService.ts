import { api } from '../lib/api-client';
import type {
  TenantSettings,
  UpdateTenantSettingsRequest,
} from '../types/doa';

export const tenantSettingsService = {
  // Get tenant settings (auto-creates if not exists)
  async getSettings(): Promise<TenantSettings> {
    return await api.get<TenantSettings>('/tenantsettings');
  },

  // Update tenant settings
  async updateSettings(request: UpdateTenantSettingsRequest): Promise<void> {
    await api.put<void>('/tenantsettings', request);
  },

  // Upload logo file
  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return await api.post<{ logoUrl: string }>('/tenantsettings/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
