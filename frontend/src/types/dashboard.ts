import type { User, WorkLocationPreference } from './api';

/**
 * Dashboard data response from API
 */
export interface DashboardData {
  user: User;
  preferences: WorkLocationPreference[];
  stats: DashboardStats;
  startDate: string;
  endDate: string;
}

/**
 * Dashboard statistics for work location preferences
 */
export interface DashboardStats {
  remoteDays: number;
  officeDays: number;
  clientSites: number;
  notSet: number;
  totalWeekdays: number;
}

/**
 * Dashboard stat display configuration
 */
export interface DashboardStatCard {
  name: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  description?: string;
}
