import { useQuery } from '@tanstack/react-query';
import { assignmentsService } from '../services/assignmentsService';
import type { GetAssignmentsParams } from '../services/assignmentsService';
import type { Assignment } from '../types/api';

export function useAssignments(params?: GetAssignmentsParams) {
  return useQuery<Assignment[], Error>({
    queryKey: ['assignments', params],
    queryFn: () => assignmentsService.getAll(params),
    // Optimize: Add caching to prevent excessive refetching
    staleTime: 1 * 60 * 1000, // Data stays fresh for 1 minute (assignments change frequently)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchOnMount: false, // Use cached data if available and fresh
  });
}

export function useAssignment(id: string) {
  return useQuery<Assignment, Error>({
    queryKey: ['assignments', id],
    queryFn: () => assignmentsService.getById(id),
    enabled: !!id,
    // Optimize: Add caching for individual assignment details
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
