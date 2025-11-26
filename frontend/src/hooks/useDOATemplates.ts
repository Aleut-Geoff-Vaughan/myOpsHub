import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doaTemplatesService } from '../services/doaTemplatesService';
import type {
  DOATemplate,
  CreateDOATemplateRequest,
  UpdateDOATemplateRequest,
} from '../types/doa';

// Query keys
export const doaTemplateKeys = {
  all: ['doaTemplates'] as const,
  lists: () => [...doaTemplateKeys.all, 'list'] as const,
  list: () => [...doaTemplateKeys.lists()] as const,
  details: () => [...doaTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...doaTemplateKeys.details(), id] as const,
};

// Get all templates
export function useDOATemplates() {
  return useQuery({
    queryKey: doaTemplateKeys.list(),
    queryFn: () => doaTemplatesService.getTemplates(),
  });
}

// Get single template
export function useDOATemplate(id: string) {
  return useQuery({
    queryKey: doaTemplateKeys.detail(id),
    queryFn: () => doaTemplatesService.getTemplate(id),
    enabled: !!id,
  });
}

// Create template
export function useCreateDOATemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateDOATemplateRequest) =>
      doaTemplatesService.createTemplate(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doaTemplateKeys.lists() });
    },
  });
}

// Update template
export function useUpdateDOATemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateDOATemplateRequest }) =>
      doaTemplatesService.updateTemplate(id, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: doaTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: doaTemplateKeys.detail(variables.id) });
    },
  });
}

// Delete template
export function useDeleteDOATemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => doaTemplatesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doaTemplateKeys.lists() });
    },
  });
}
