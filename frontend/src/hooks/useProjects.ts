import { useQuery } from '@tanstack/react-query';
import { projectsService } from '../services/projectsService';
import type { GetProjectsParams } from '../services/projectsService';
import type { Project } from '../types/api';

export function useProjects(params?: GetProjectsParams) {
  return useQuery<Project[], Error>({
    queryKey: ['projects', params],
    queryFn: () => projectsService.getAll(params),
    // Optimize: Add caching to prevent excessive refetching
    staleTime: 2 * 60 * 1000, // Data stays fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchOnMount: false, // Use cached data if available and fresh
  });
}

export function useProject(id: string) {
  return useQuery<Project, Error>({
    queryKey: ['projects', id],
    queryFn: () => projectsService.getById(id),
    enabled: !!id,
    // Optimize: Add caching for individual project details
    staleTime: 5 * 60 * 1000, // Details can be cached longer
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
