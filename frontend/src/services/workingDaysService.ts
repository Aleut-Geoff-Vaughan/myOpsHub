import { api } from '../lib/api-client';
import type { MonthWorkingDays } from '../types/forecast';

export const workingDaysService = {
  // Get working days for a specific month
  getMonthWorkingDays: async (year: number, month: number): Promise<MonthWorkingDays> => {
    return api.get<MonthWorkingDays>(`/working-days/month/${year}/${month}`);
  },

  // Get working days for a range of months
  getMonthRangeWorkingDays: async (
    startYear: number,
    startMonth: number,
    monthCount: number
  ): Promise<MonthWorkingDays[]> => {
    const params = new URLSearchParams();
    params.append('startYear', startYear.toString());
    params.append('startMonth', startMonth.toString());
    params.append('monthCount', monthCount.toString());
    return api.get<MonthWorkingDays[]>(`/working-days/range?${params.toString()}`);
  },

  // Get available hours for a specific month
  getMonthAvailableHours: async (year: number, month: number): Promise<number> => {
    const result = await api.get<{ availableHours: number }>(`/working-days/month/${year}/${month}/hours`);
    return result.availableHours;
  },

  // Calculate forecast hours (with optional utilization percentage)
  calculateForecastHours: async (
    year: number,
    month: number,
    utilizationPercent?: number
  ): Promise<number> => {
    const params = new URLSearchParams();
    if (utilizationPercent !== undefined) {
      params.append('utilizationPercent', utilizationPercent.toString());
    }
    const result = await api.get<{ forecastHours: number }>(
      `/working-days/month/${year}/${month}/forecast?${params.toString()}`
    );
    return result.forecastHours;
  },
};
