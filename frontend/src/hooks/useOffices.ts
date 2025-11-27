import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { officesService, type GetOfficesParams } from '../services/officesService';
import type { CreateOfficeRequest, UpdateOfficeRequest } from '../types/api';

// Query keys
export const officeKeys = {
  all: ['offices'] as const,
  lists: () => [...officeKeys.all, 'list'] as const,
  list: (params: GetOfficesParams) => [...officeKeys.lists(), params] as const,
  details: () => [...officeKeys.all, 'detail'] as const,
  detail: (id: string) => [...officeKeys.details(), id] as const,
};

// Get all offices for a tenant
export function useOffices(params: GetOfficesParams) {
  return useQuery({
    queryKey: officeKeys.list(params),
    queryFn: () => officesService.getAll(params),
    enabled: !!params.tenantId,
  });
}

// Get single office
export function useOffice(id: string) {
  return useQuery({
    queryKey: officeKeys.detail(id),
    queryFn: () => officesService.getById(id),
    enabled: !!id,
  });
}

// Create office
export function useCreateOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateOfficeRequest) => officesService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: officeKeys.lists() });
    },
  });
}

// Update office
export function useUpdateOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateOfficeRequest }) =>
      officesService.update(id, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: officeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: officeKeys.detail(variables.id) });
    },
  });
}

// Delete office
export function useDeleteOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => officesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: officeKeys.lists() });
    },
  });
}
