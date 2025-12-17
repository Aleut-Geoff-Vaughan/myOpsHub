import { describe, it, expect } from 'vitest';
import {
  getFiscalYear,
  getFiscalQuarter,
  getFiscalMonth,
  generateMonthRange,
  formatFiscalYear,
  getFiscalYearStartDate,
  getFiscalYearEndDate,
} from './useFiscalYear';

describe('useFiscalYear utility functions', () => {
  describe('getFiscalYear', () => {
    describe('with October start (federal fiscal year)', () => {
      const startMonth = 10;

      it('returns current calendar year + 1 for October', () => {
        const date = new Date(2024, 9, 15); // October 15, 2024
        expect(getFiscalYear(date, startMonth)).toBe(2025);
      });

      it('returns current calendar year + 1 for November', () => {
        const date = new Date(2024, 10, 1); // November 1, 2024
        expect(getFiscalYear(date, startMonth)).toBe(2025);
      });

      it('returns current calendar year + 1 for December', () => {
        const date = new Date(2024, 11, 31); // December 31, 2024
        expect(getFiscalYear(date, startMonth)).toBe(2025);
      });

      it('returns same calendar year for January', () => {
        const date = new Date(2025, 0, 1); // January 1, 2025
        expect(getFiscalYear(date, startMonth)).toBe(2025);
      });

      it('returns same calendar year for September', () => {
        const date = new Date(2025, 8, 30); // September 30, 2025
        expect(getFiscalYear(date, startMonth)).toBe(2025);
      });
    });

    describe('with January start (calendar year)', () => {
      const startMonth = 1;

      it('returns same year for all months', () => {
        expect(getFiscalYear(new Date(2025, 0, 1), startMonth)).toBe(2025);
        expect(getFiscalYear(new Date(2025, 5, 15), startMonth)).toBe(2025);
        expect(getFiscalYear(new Date(2025, 11, 31), startMonth)).toBe(2025);
      });
    });

    describe('with July start (state fiscal year)', () => {
      const startMonth = 7;

      it('returns current year + 1 for July onwards', () => {
        const date = new Date(2024, 6, 1); // July 1, 2024
        expect(getFiscalYear(date, startMonth)).toBe(2025);
      });

      it('returns same year for months before July', () => {
        const date = new Date(2024, 5, 30); // June 30, 2024
        expect(getFiscalYear(date, startMonth)).toBe(2024);
      });
    });
  });

  describe('getFiscalQuarter', () => {
    describe('with October start', () => {
      const startMonth = 10;

      it('returns Q1 for Oct-Dec', () => {
        expect(getFiscalQuarter(10, startMonth)).toBe(1); // October
        expect(getFiscalQuarter(11, startMonth)).toBe(1); // November
        expect(getFiscalQuarter(12, startMonth)).toBe(1); // December
      });

      it('returns Q2 for Jan-Mar', () => {
        expect(getFiscalQuarter(1, startMonth)).toBe(2); // January
        expect(getFiscalQuarter(2, startMonth)).toBe(2); // February
        expect(getFiscalQuarter(3, startMonth)).toBe(2); // March
      });

      it('returns Q3 for Apr-Jun', () => {
        expect(getFiscalQuarter(4, startMonth)).toBe(3); // April
        expect(getFiscalQuarter(5, startMonth)).toBe(3); // May
        expect(getFiscalQuarter(6, startMonth)).toBe(3); // June
      });

      it('returns Q4 for Jul-Sep', () => {
        expect(getFiscalQuarter(7, startMonth)).toBe(4); // July
        expect(getFiscalQuarter(8, startMonth)).toBe(4); // August
        expect(getFiscalQuarter(9, startMonth)).toBe(4); // September
      });
    });

    describe('with January start', () => {
      const startMonth = 1;

      it('returns Q1 for Jan-Mar', () => {
        expect(getFiscalQuarter(1, startMonth)).toBe(1);
        expect(getFiscalQuarter(2, startMonth)).toBe(1);
        expect(getFiscalQuarter(3, startMonth)).toBe(1);
      });

      it('returns Q4 for Oct-Dec', () => {
        expect(getFiscalQuarter(10, startMonth)).toBe(4);
        expect(getFiscalQuarter(11, startMonth)).toBe(4);
        expect(getFiscalQuarter(12, startMonth)).toBe(4);
      });
    });
  });

  describe('getFiscalMonth', () => {
    describe('with October start', () => {
      const startMonth = 10;

      it('returns 1 for October (first month of fiscal year)', () => {
        expect(getFiscalMonth(10, startMonth)).toBe(1);
      });

      it('returns 2 for November', () => {
        expect(getFiscalMonth(11, startMonth)).toBe(2);
      });

      it('returns 3 for December', () => {
        expect(getFiscalMonth(12, startMonth)).toBe(3);
      });

      it('returns 4 for January', () => {
        expect(getFiscalMonth(1, startMonth)).toBe(4);
      });

      it('returns 12 for September (last month of fiscal year)', () => {
        expect(getFiscalMonth(9, startMonth)).toBe(12);
      });
    });

    describe('with January start', () => {
      const startMonth = 1;

      it('returns month number unchanged', () => {
        expect(getFiscalMonth(1, startMonth)).toBe(1);
        expect(getFiscalMonth(6, startMonth)).toBe(6);
        expect(getFiscalMonth(12, startMonth)).toBe(12);
      });
    });
  });

  describe('generateMonthRange', () => {
    const config = { startMonth: 10, prefix: 'FY' };

    it('generates correct number of months', () => {
      const result = generateMonthRange(new Date(2024, 0, 1), 6, config);
      expect(result).toHaveLength(6);
    });

    it('includes correct month information', () => {
      const result = generateMonthRange(new Date(2024, 9, 1), 3, config);

      expect(result[0].year).toBe(2024);
      expect(result[0].month).toBe(10);
      expect(result[0].fiscalYear).toBe(2025);
      expect(result[0].fiscalMonth).toBe(1);
      expect(result[0].isFirstOfFiscalYear).toBe(true);
    });

    it('generates consecutive months', () => {
      const result = generateMonthRange(new Date(2024, 0, 1), 3, config);

      expect(result[0].month).toBe(1);
      expect(result[1].month).toBe(2);
      expect(result[2].month).toBe(3);
    });

    it('handles year boundary correctly', () => {
      const result = generateMonthRange(new Date(2024, 10, 1), 3, config);

      expect(result[0].month).toBe(11);
      expect(result[0].year).toBe(2024);
      expect(result[1].month).toBe(12);
      expect(result[1].year).toBe(2024);
      expect(result[2].month).toBe(1);
      expect(result[2].year).toBe(2025);
    });

    it('sets correct labels', () => {
      const result = generateMonthRange(new Date(2024, 0, 1), 1, config);

      expect(result[0].label).toBe('Jan 24');
    });

    it('identifies first of quarter correctly', () => {
      const result = generateMonthRange(new Date(2024, 9, 1), 6, config);

      // October is fiscal month 1 (first of Q1)
      expect(result[0].isFirstOfQuarter).toBe(true);
      // November is fiscal month 2
      expect(result[1].isFirstOfQuarter).toBe(false);
      // December is fiscal month 3
      expect(result[2].isFirstOfQuarter).toBe(false);
      // January is fiscal month 4 (first of Q2)
      expect(result[3].isFirstOfQuarter).toBe(true);
    });
  });

  describe('formatFiscalYear', () => {
    it('formats fiscal year with prefix', () => {
      expect(formatFiscalYear(2025, 'FY', 10)).toBe('FY2025');
    });

    it('formats calendar year differently', () => {
      expect(formatFiscalYear(2025, 'FY', 1)).toBe('Calendar Year 2025');
    });

    it('uses custom prefix', () => {
      expect(formatFiscalYear(2025, 'Fiscal Year ', 10)).toBe('Fiscal Year 2025');
    });
  });

  describe('getFiscalYearStartDate', () => {
    describe('with October start', () => {
      const startMonth = 10;

      it('returns October 1st of previous calendar year', () => {
        const result = getFiscalYearStartDate(2025, startMonth);
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(9); // October
        expect(result.getDate()).toBe(1);
      });
    });

    describe('with January start', () => {
      const startMonth = 1;

      it('returns January 1st of the fiscal year', () => {
        const result = getFiscalYearStartDate(2025, startMonth);
        expect(result.getFullYear()).toBe(2025);
        expect(result.getMonth()).toBe(0); // January
        expect(result.getDate()).toBe(1);
      });
    });
  });

  describe('getFiscalYearEndDate', () => {
    describe('with October start', () => {
      const startMonth = 10;

      it('returns September 30th of the fiscal year', () => {
        const result = getFiscalYearEndDate(2025, startMonth);
        expect(result.getFullYear()).toBe(2025);
        expect(result.getMonth()).toBe(8); // September
        expect(result.getDate()).toBe(30);
      });
    });

    describe('with January start', () => {
      const startMonth = 1;

      it('returns December 31st of the fiscal year', () => {
        const result = getFiscalYearEndDate(2025, startMonth);
        expect(result.getFullYear()).toBe(2025);
        expect(result.getMonth()).toBe(11); // December
        expect(result.getDate()).toBe(31);
      });
    });
  });

  describe('edge cases', () => {
    it('handles February in leap year correctly', () => {
      const config = { startMonth: 1, prefix: '' };
      const result = generateMonthRange(new Date(2024, 1, 1), 1, config);

      expect(result[0].month).toBe(2);
      expect(result[0].year).toBe(2024);
    });

    it('handles 12 month range', () => {
      const config = { startMonth: 10, prefix: 'FY' };
      const result = generateMonthRange(new Date(2024, 9, 1), 12, config);

      expect(result).toHaveLength(12);
      expect(result[0].month).toBe(10);
      expect(result[11].month).toBe(9);
      expect(result[11].fiscalMonth).toBe(12);
    });

    it('handles single month range', () => {
      const config = { startMonth: 10, prefix: 'FY' };
      const result = generateMonthRange(new Date(2024, 0, 1), 1, config);

      expect(result).toHaveLength(1);
    });
  });
});
