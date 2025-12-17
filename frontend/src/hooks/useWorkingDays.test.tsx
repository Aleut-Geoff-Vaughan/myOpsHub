import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMonthWorkingDays, useMonthRangeWorkingDays, useMonthAvailableHours } from './useWorkingDays';
import { workingDaysService } from '../services/workingDaysService';
import type { ReactNode } from 'react';

// Mock the service
vi.mock('../services/workingDaysService', () => ({
  workingDaysService: {
    getMonthWorkingDays: vi.fn(),
    getMonthRangeWorkingDays: vi.fn(),
    getMonthAvailableHours: vi.fn(),
  },
}));

// Create wrapper for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useWorkingDays hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMonthWorkingDays', () => {
    const mockMonthWorkingDays = {
      year: 2025,
      month: 1,
      totalDays: 31,
      businessDays: 22,
      weekends: 9,
      holidays: 0,
      ptoDays: 0,
      netWorkingDays: 22,
      availableHours: 176,
    };

    beforeEach(() => {
      vi.mocked(workingDaysService.getMonthWorkingDays).mockResolvedValue(mockMonthWorkingDays);
    });

    it('fetches working days for valid year and month', async () => {
      const { result } = renderHook(
        () => useMonthWorkingDays(2025, 1),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockMonthWorkingDays);
      expect(workingDaysService.getMonthWorkingDays).toHaveBeenCalledWith(2025, 1);
    });

    it('is disabled when year is 0 or negative', () => {
      const { result: result1 } = renderHook(
        () => useMonthWorkingDays(0, 1),
        { wrapper: createWrapper() }
      );

      const { result: result2 } = renderHook(
        () => useMonthWorkingDays(-1, 1),
        { wrapper: createWrapper() }
      );

      expect(result1.current.fetchStatus).toBe('idle');
      expect(result2.current.fetchStatus).toBe('idle');
      expect(workingDaysService.getMonthWorkingDays).not.toHaveBeenCalled();
    });

    it('is disabled when month is out of range', () => {
      const { result: result1 } = renderHook(
        () => useMonthWorkingDays(2025, 0),
        { wrapper: createWrapper() }
      );

      const { result: result2 } = renderHook(
        () => useMonthWorkingDays(2025, 13),
        { wrapper: createWrapper() }
      );

      expect(result1.current.fetchStatus).toBe('idle');
      expect(result2.current.fetchStatus).toBe('idle');
      expect(workingDaysService.getMonthWorkingDays).not.toHaveBeenCalled();
    });

    it('is enabled for all valid months (1-12)', async () => {
      for (let month = 1; month <= 12; month++) {
        vi.mocked(workingDaysService.getMonthWorkingDays).mockResolvedValue({
          ...mockMonthWorkingDays,
          month,
        });

        const { result } = renderHook(
          () => useMonthWorkingDays(2025, month),
          { wrapper: createWrapper() }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.month).toBe(month);
      }
    });
  });

  describe('useMonthRangeWorkingDays', () => {
    const mockRangeData = [
      { year: 2025, month: 1, totalDays: 31, businessDays: 22, weekends: 9, holidays: 0, ptoDays: 0, netWorkingDays: 22, availableHours: 176 },
      { year: 2025, month: 2, totalDays: 28, businessDays: 20, weekends: 8, holidays: 0, ptoDays: 0, netWorkingDays: 20, availableHours: 160 },
      { year: 2025, month: 3, totalDays: 31, businessDays: 21, weekends: 10, holidays: 0, ptoDays: 0, netWorkingDays: 21, availableHours: 168 },
    ];

    beforeEach(() => {
      vi.mocked(workingDaysService.getMonthRangeWorkingDays).mockResolvedValue(mockRangeData);
    });

    it('fetches working days for a range of months', async () => {
      const { result } = renderHook(
        () => useMonthRangeWorkingDays(2025, 1, 3),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRangeData);
      expect(workingDaysService.getMonthRangeWorkingDays).toHaveBeenCalledWith(2025, 1, 3);
    });

    it('is disabled when year is invalid', () => {
      const { result } = renderHook(
        () => useMonthRangeWorkingDays(0, 1, 3),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled when start month is invalid', () => {
      const { result: result1 } = renderHook(
        () => useMonthRangeWorkingDays(2025, 0, 3),
        { wrapper: createWrapper() }
      );

      const { result: result2 } = renderHook(
        () => useMonthRangeWorkingDays(2025, 13, 3),
        { wrapper: createWrapper() }
      );

      expect(result1.current.fetchStatus).toBe('idle');
      expect(result2.current.fetchStatus).toBe('idle');
    });

    it('is disabled when month count is 0 or negative', () => {
      const { result: result1 } = renderHook(
        () => useMonthRangeWorkingDays(2025, 1, 0),
        { wrapper: createWrapper() }
      );

      const { result: result2 } = renderHook(
        () => useMonthRangeWorkingDays(2025, 1, -1),
        { wrapper: createWrapper() }
      );

      expect(result1.current.fetchStatus).toBe('idle');
      expect(result2.current.fetchStatus).toBe('idle');
    });

    it('has correct query key structure', async () => {
      const { result } = renderHook(
        () => useMonthRangeWorkingDays(2025, 6, 12),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(workingDaysService.getMonthRangeWorkingDays).toHaveBeenCalledWith(2025, 6, 12);
    });
  });

  describe('useMonthAvailableHours', () => {
    beforeEach(() => {
      vi.mocked(workingDaysService.getMonthAvailableHours).mockResolvedValue(176);
    });

    it('fetches available hours for a valid month', async () => {
      const { result } = renderHook(
        () => useMonthAvailableHours(2025, 1),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(176);
      expect(workingDaysService.getMonthAvailableHours).toHaveBeenCalledWith(2025, 1);
    });

    it('is disabled when year is invalid', () => {
      const { result } = renderHook(
        () => useMonthAvailableHours(0, 1),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('is disabled when month is out of range', () => {
      const { result: result1 } = renderHook(
        () => useMonthAvailableHours(2025, 0),
        { wrapper: createWrapper() }
      );

      const { result: result2 } = renderHook(
        () => useMonthAvailableHours(2025, 13),
        { wrapper: createWrapper() }
      );

      expect(result1.current.fetchStatus).toBe('idle');
      expect(result2.current.fetchStatus).toBe('idle');
    });
  });

  describe('query configuration', () => {
    it('has appropriate stale time for working days data', async () => {
      vi.mocked(workingDaysService.getMonthWorkingDays).mockResolvedValue({
        year: 2025, month: 1, totalDays: 31, businessDays: 22, weekends: 9, holidays: 0, ptoDays: 0, netWorkingDays: 22, availableHours: 176,
      });

      const { result } = renderHook(
        () => useMonthWorkingDays(2025, 1),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Data should not be refetched immediately (staleTime is 30 minutes)
      expect(result.current.isStale).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      vi.mocked(workingDaysService.getMonthWorkingDays).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(
        () => useMonthWorkingDays(2025, 1),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Network error');
    });
  });
});
