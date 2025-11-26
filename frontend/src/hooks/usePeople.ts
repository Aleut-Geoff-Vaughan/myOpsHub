import { useQuery } from '@tanstack/react-query';
import { peopleService, type PeopleQuery } from '../services/peopleService';

export const usePeople = (params: PeopleQuery) => {
  return useQuery({
    queryKey: ['people', params],
    queryFn: () => peopleService.getPeople(params),
    enabled: !!params.tenantId,
    // Optimize: Add caching to prevent excessive refetching
    staleTime: 3 * 60 * 1000, // People data doesn't change frequently - 3 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchOnMount: false, // Use cached data if available and fresh
  });
};

export const usePerson = (id?: string) => {
  return useQuery({
    queryKey: ['people', id],
    queryFn: () => peopleService.getPerson(id!),
    enabled: !!id,
    // Optimize: Add caching for individual person details
    staleTime: 5 * 60 * 1000, // Details can be cached longer
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
