import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '../services/templateService';
import type {
  WorkLocationTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ApplyTemplateRequest,
} from '../types/template';

export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplates(),
  });
};

export const useTemplate = (id: string) => {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => templateService.getTemplate(id),
    enabled: !!id,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTemplateRequest) => templateService.createTemplate(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateTemplateRequest }) =>
      templateService.updateTemplate(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => templateService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useApplyTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: ApplyTemplateRequest }) =>
      templateService.applyTemplate(id, request),
    onSuccess: () => {
      // Invalidate and refetch work location preferences
      queryClient.invalidateQueries({ queryKey: ['workLocationPreferences'] });

      // Invalidate and immediately refetch all dashboard queries
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });
      queryClient.refetchQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });
    },
  });
};
