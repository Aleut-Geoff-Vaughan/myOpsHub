import { api } from '../lib/api-client';
import type {
  TenantSettings,
  UpdateTenantSettingsRequest,
} from '../types/doa';

export const tenantSettingsService = {
  // Get tenant settings (auto-creates if not exists)
  async getSettings(): Promise<TenantSettings> {
    const response = await api.get('/tenantsettings');
    return response.data;
  },

  // Update tenant settings
  async updateSettings(request: UpdateTenantSettingsRequest): Promise<void> {
    await api.put('/tenantsettings', request);
  },

  // Upload logo file
  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/tenantsettings/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
