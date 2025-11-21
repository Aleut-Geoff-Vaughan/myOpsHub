import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workLocationService } from '../services/workLocationService';
import type { WorkLocationPreference } from '../types/api';

export function useWorkLocationPreferences(params?: {
  personId?: string;
  startDate?: string;
  endDate?: string;
  locationType?: number;
}) {
  return useQuery({
    queryKey: ['workLocationPreferences', params],
    queryFn: () => workLocationService.getAll(params),
    enabled: !!params,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on tab switch
  });
}

export function useWorkLocationPreference(id?: string) {
  return useQuery({
    queryKey: ['workLocationPreference', id],
    queryFn: () => workLocationService.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateWorkLocationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preference: Omit<WorkLocationPreference, 'id' | 'createdAt' | 'updatedAt'>) =>
      workLocationService.create(preference),
    onMutate: async (newPreference) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workLocationPreferences'] });
      await queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });

      // Snapshot previous values
      const previousPreferences = queryClient.getQueryData(['workLocationPreferences']);
      const previousDashboard = queryClient.getQueriesData({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });

      // Optimistically update cache
      queryClient.setQueryData(
        ['workLocationPreferences', { personId: newPreference.personId }],
        (old: WorkLocationPreference[] | undefined) => {
          if (!old) return old;
          return [...old, { ...newPreference, id: 'temp-' + Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as WorkLocationPreference];
        }
      );

      return { previousPreferences, previousDashboard };
    },
    onError: (_err, _newPreference, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(['workLocationPreferences'], context.previousPreferences);
      }
      if (context?.previousDashboard) {
        context.previousDashboard.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: ['workLocationPreferences'] });
      // Invalidate all dashboard queries regardless of parameters
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });
    },
  });
}

export function useUpdateWorkLocationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, preference }: { id: string; preference: WorkLocationPreference }) =>
      workLocationService.update(id, preference),
    onMutate: async ({ id, preference }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workLocationPreferences'] });
      await queryClient.cancelQueries({ queryKey: ['workLocationPreference', id] });
      await queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });

      // Snapshot previous values
      const previousPreferences = queryClient.getQueryData(['workLocationPreferences']);
      const previousPreference = queryClient.getQueryData(['workLocationPreference', id]);
      const previousDashboard = queryClient.getQueriesData({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });

      // Optimistically update cache
      queryClient.setQueryData(['workLocationPreference', id], preference);
      queryClient.setQueryData(
        ['workLocationPreferences', { personId: preference.personId }],
        (old: WorkLocationPreference[] | undefined) => {
          if (!old) return old;
          return old.map(p => p.id === id ? preference : p);
        }
      );

      return { previousPreferences, previousPreference, previousDashboard };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(['workLocationPreferences'], context.previousPreferences);
      }
      if (context?.previousPreference) {
        queryClient.setQueryData(['workLocationPreference', id], context.previousPreference);
      }
      if (context?.previousDashboard) {
        context.previousDashboard.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: ['workLocationPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['workLocationPreference'] });
      // Invalidate all dashboard queries regardless of parameters
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });
    },
  });
}

export function useDeleteWorkLocationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workLocationService.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workLocationPreferences'] });
      await queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });

      // Snapshot previous values
      const previousPreferences = queryClient.getQueryData(['workLocationPreferences']);
      const previousDashboard = queryClient.getQueriesData({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });

      // Optimistically remove from cache
      queryClient.setQueryData(
        ['workLocationPreferences'],
        (old: WorkLocationPreference[] | undefined) => {
          if (!old) return old;
          return old.filter(p => p.id !== id);
        }
      );

      return { previousPreferences, previousDashboard };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(['workLocationPreferences'], context.previousPreferences);
      }
      if (context?.previousDashboard) {
        context.previousDashboard.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: ['workLocationPreferences'] });
      // Invalidate all dashboard queries regardless of parameters
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });
    },
  });
}

export function useCreateBulkWorkLocationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Omit<WorkLocationPreference, 'id' | 'createdAt' | 'updatedAt'>[]) =>
      workLocationService.createBulk(preferences),
    onMutate: async (newPreferences) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workLocationPreferences'] });
      await queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });

      // Snapshot previous values
      const previousPreferences = queryClient.getQueryData(['workLocationPreferences']);
      const previousDashboard = queryClient.getQueriesData({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });

      // Optimistically add all preferences
      const personId = newPreferences[0]?.personId;
      if (personId) {
        queryClient.setQueryData(
          ['workLocationPreferences', { personId }],
          (old: WorkLocationPreference[] | undefined) => {
            if (!old) return old;
            const tempPreferences = newPreferences.map((pref, index) => ({
              ...pref,
              id: 'temp-' + Date.now() + '-' + index,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as WorkLocationPreference));
            return [...old, ...tempPreferences];
          }
        );
      }

      return { previousPreferences, previousDashboard };
    },
    onError: (_err, _newPreferences, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(['workLocationPreferences'], context.previousPreferences);
      }
      if (context?.previousDashboard) {
        context.previousDashboard.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: ['workLocationPreferences'] });
      // Invalidate all dashboard queries regardless of parameters
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'dashboard'
      });
    },
  });
}
