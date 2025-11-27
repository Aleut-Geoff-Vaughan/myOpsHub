import { useMemo } from 'react';
import { WorkLocationType, type WorkLocationPreference } from '../types/api';
import { isToday, isPast, getMondayOfWeek } from '../utils/dateUtils';

interface WeekCalendarViewProps {
  startDate: Date;
  preferences: WorkLocationPreference[];
  onDayClick: (date: Date) => void;
  userId: string;
  weeksToShow?: 1 | 2; // Optional: show 1 or 2 weeks (default 2)
  daysPerWeek?: 5 | 7; // Optional: show 5 days (Mon-Fri) or 7 days (default 5)
}

export function WeekCalendarView({
  startDate,
  preferences,
  onDayClick,
  userId,
  weeksToShow = 2,
  daysPerWeek = 5
}: WeekCalendarViewProps) {
  // Generate days based on weeks and days per week setting
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const monday = getMondayOfWeek(startDate);

    for (let week = 0; week < weeksToShow; week++) {
      const weekStart = new Date(monday);
      weekStart.setDate(monday.getDate() + (week * 7));

      for (let day = 0; day < daysPerWeek; day++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + day);
        days.push(date);
      }
    }

    return days;
  }, [startDate, weeksToShow, daysPerWeek]);

  const getPreferenceForDate = (date: Date): WorkLocationPreference | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return preferences.find(p => p.workDate === dateStr && p.userId === userId);
  };

  const getLocationTypeLabel = (type: WorkLocationType): string => {
    switch (type) {
      case WorkLocationType.Remote:
        return 'Remote';
      case WorkLocationType.RemotePlus:
        return 'Remote+';
      case WorkLocationType.ClientSite:
        return 'Client Site';
      case WorkLocationType.OfficeNoReservation:
        return 'Office';
      case WorkLocationType.OfficeWithReservation:
        return 'Office (Reserved)';
      case WorkLocationType.PTO:
        return 'PTO';
      case WorkLocationType.Travel:
        return 'Travel';
      default:
        return 'Unknown';
    }
  };

  const getLocationTypeColor = (type: WorkLocationType): string => {
    switch (type) {
      case WorkLocationType.Remote:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case WorkLocationType.RemotePlus:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case WorkLocationType.ClientSite:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case WorkLocationType.OfficeNoReservation:
        return 'bg-green-100 text-green-800 border-green-300';
      case WorkLocationType.OfficeWithReservation:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case WorkLocationType.PTO:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case WorkLocationType.Travel:
        return 'bg-sky-100 text-sky-800 border-sky-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLocationIcon = (type: WorkLocationType): string => {
    switch (type) {
      case WorkLocationType.Remote:
      case WorkLocationType.RemotePlus:
        return '🏠';
      case WorkLocationType.ClientSite:
        return '🏢';
      case WorkLocationType.OfficeNoReservation:
      case WorkLocationType.OfficeWithReservation:
        return '🏛️';
      case WorkLocationType.PTO:
        return '🌴';
      case WorkLocationType.Travel:
        return '✈️';
      default:
        return '📍';
    }
  };

  // Check if a date is a weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Render a single day card
  const renderDayCard = (date: Date) => {
    const preference = getPreferenceForDate(date);
    const today = isToday(date);
    const past = isPast(date);
    const weekend = isWeekend(date);

    return (
      <button
        key={date.toISOString()}
        onClick={() => onDayClick(date)}
        className={`
          relative p-4 rounded-lg border-2 transition-all
          ${today ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
          ${past ? 'opacity-60' : ''}
          ${weekend && !preference ? 'bg-gray-50 border-gray-200' : ''}
          ${preference
            ? getLocationTypeColor(preference.locationType)
            : weekend
              ? 'bg-gray-50 border-gray-200 hover:border-gray-300'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }
          hover:shadow-md cursor-pointer
        `}
      >
        {/* Day Header */}
        <div className="text-center mb-2">
          <div className={`text-xs font-medium ${weekend ? 'text-gray-500' : 'text-gray-600'}`}>
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
          <div className={`text-lg font-bold ${today ? 'text-primary-600' : weekend ? 'text-gray-600' : 'text-gray-900'}`}>
            {date.getDate()}
          </div>
        </div>

        {/* Location Info */}
        {preference ? (
          <div className="text-center">
            <div className="text-2xl mb-1">
              {getLocationIcon(preference.locationType)}
            </div>
            <div className="text-xs font-semibold">
              {getLocationTypeLabel(preference.locationType)}
            </div>
            {preference.remoteLocation && (
              <div className="text-xs text-gray-600 mt-1 truncate">
                {preference.remoteLocation}
              </div>
            )}
            {preference.office && (
              <div className="text-xs text-gray-600 mt-1 truncate">
                {preference.office.name}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-1">{weekend ? '📅' : '❓'}</div>
            <div className="text-xs">{weekend ? 'Weekend' : 'Not set'}</div>
          </div>
        )}

        {/* Today indicator */}
        {today && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></div>
        )}
      </button>
    );
  };

  const gridCols = daysPerWeek === 7 ? 'grid-cols-7' : 'grid-cols-5';

  return (
    <div className="space-y-6">
      {/* Week 1 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {weeksToShow === 1 ? 'This Week' : 'Week 1'}
        </h3>
        <div className={`grid ${gridCols} gap-3`}>
          {weekDays.slice(0, daysPerWeek).map(renderDayCard)}
        </div>
      </div>

      {/* Week 2 - Only show if weeksToShow === 2 */}
      {weeksToShow === 2 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Week 2
          </h3>
          <div className={`grid ${gridCols} gap-3`}>
            {weekDays.slice(daysPerWeek, daysPerWeek * 2).map(renderDayCard)}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span>🏠</span>
            <span>Remote / Remote+</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏢</span>
            <span>Client Site</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏛️</span>
            <span>Office</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌴</span>
            <span>PTO</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✈️</span>
            <span>Travel</span>
          </div>
          <div className="flex items-center gap-2">
            <span>❓</span>
            <span>Not Set</span>
          </div>
          {daysPerWeek === 7 && (
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>Weekend</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
