import type { CalendarMode } from '../hooks/useFiscalYear';

interface FiscalYearToggleProps {
  mode: CalendarMode;
  onToggle: () => void;
  isCalendarYear?: boolean;
  fiscalYearPrefix?: string;
  currentFiscalYear?: number;
  className?: string;
}

/**
 * Toggle component for switching between fiscal year and calendar year view
 */
export function FiscalYearToggle({
  mode,
  onToggle,
  isCalendarYear = false,
  fiscalYearPrefix = 'FY',
  currentFiscalYear,
  className = '',
}: FiscalYearToggleProps) {
  // If fiscal year = calendar year, show a simple indicator
  if (isCalendarYear) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500">Calendar Year</span>
        {currentFiscalYear && (
          <span className="text-sm font-semibold text-gray-700">{currentFiscalYear}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={onToggle}
        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 bg-gray-200"
        role="switch"
        aria-checked={mode === 'fiscal'}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            mode === 'fiscal' ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <div className="flex items-center gap-2 min-w-[100px]">
        <span className={`text-sm font-medium ${mode === 'fiscal' ? 'text-emerald-700' : 'text-gray-500'}`}>
          {mode === 'fiscal' ? `${fiscalYearPrefix} View` : 'Calendar View'}
        </span>
        {currentFiscalYear && mode === 'fiscal' && (
          <span className="text-sm font-semibold text-emerald-700">
            ({fiscalYearPrefix}{currentFiscalYear})
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact fiscal year badge/pill showing current fiscal year
 */
interface FiscalYearBadgeProps {
  fiscalYear: number;
  prefix?: string;
  variant?: 'default' | 'small' | 'large';
  className?: string;
}

export function FiscalYearBadge({
  fiscalYear,
  prefix = 'FY',
  variant = 'default',
  className = '',
}: FiscalYearBadgeProps) {
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-sm',
    large: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-emerald-100 text-emerald-800 ${sizeClasses[variant]} ${className}`}
    >
      {prefix}{fiscalYear}
    </span>
  );
}

/**
 * Dropdown selector for choosing a specific fiscal year
 */
interface FiscalYearSelectorProps {
  selectedYear: number;
  onChange: (year: number) => void;
  prefix?: string;
  yearsBack?: number;
  yearsForward?: number;
  className?: string;
}

export function FiscalYearSelector({
  selectedYear,
  onChange,
  prefix = 'FY',
  yearsBack = 2,
  yearsForward = 3,
  className = '',
}: FiscalYearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  for (let y = currentYear - yearsBack; y <= currentYear + yearsForward; y++) {
    years.push(y);
  }

  return (
    <select
      value={selectedYear}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className={`px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:border-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${className}`}
    >
      {years.map((year) => (
        <option key={year} value={year}>
          {prefix}{year}
        </option>
      ))}
    </select>
  );
}
