import { api } from '../lib/api-client';
import type { DashboardData } from '../types/dashboard';

/**
 * Dashboard service for fetching aggregated dashboard data
 */
export const dashboardService = {
  /**
   * Get dashboard data for current user
   * Returns person info, work location preferences, and calculated statistics
   *
   * @param userId - Current user's ID
   * @param startDate - Optional start date (defaults to Monday of current week)
   * @param endDate - Optional end date (defaults to Friday of next week)
   * @returns Dashboard data with person, preferences, and stats
   */
  getDashboard: async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DashboardData> => {
    const params = new URLSearchParams({ userId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return api.get<DashboardData>(`/dashboard?${params.toString()}`);
  },
};
