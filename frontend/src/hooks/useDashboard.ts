import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import type { DashboardData } from '../types/dashboard';

/**
 * Hook to fetch dashboard data for current user
 * Includes caching and automatic refetch configuration
 *
 * @param userId - Current user's ID
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Query result with dashboard data
 */
export function useDashboard(
  userId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery<DashboardData, Error>({
    queryKey: ['dashboard', userId, startDate, endDate],
    queryFn: () => dashboardService.getDashboard(userId!, startDate, endDate),
    enabled: !!userId,
    staleTime: 0, // Always consider data stale - refetch on mount
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchOnMount: true, // Always refetch when component mounts
  });
}
