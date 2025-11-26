import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantSettingsService } from '../services/tenantSettingsService';
import type { UpdateTenantSettingsRequest } from '../types/doa';

// Query keys
export const tenantSettingsKeys = {
  all: ['tenantSettings'] as const,
  settings: () => [...tenantSettingsKeys.all, 'settings'] as const,
};

// Get tenant settings
export function useTenantSettings() {
  return useQuery({
    queryKey: tenantSettingsKeys.settings(),
    queryFn: () => tenantSettingsService.getSettings(),
  });
}

// Update tenant settings
export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateTenantSettingsRequest) =>
      tenantSettingsService.updateSettings(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.settings() });
    },
  });
}

// Upload logo
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => tenantSettingsService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.settings() });
    },
  });
}
