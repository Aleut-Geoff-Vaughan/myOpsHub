import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDashboard } from '../hooks/useDashboard';
import { bookingsService } from '../services/bookingsService';
import { doaService } from '../services/doaService';
import { projectAssignmentsService } from '../services/projectAssignmentsService';
import { getMondayOfWeek } from '../utils/dateUtils';
import { BookingStatus, ProjectAssignmentStatus } from '../types/api';
import type { DelegationOfAuthorityLetter } from '../types/doa';
import type { Booking, ProjectAssignment } from '../types/api';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';

type ViewMode = '1week' | '2weeks' | 'month';

interface PersonScheduleViewProps {
  userId: string;
  displayName: string;
}

// Get date range based on view mode and offset
function getDateRange(viewMode: ViewMode, weekOffset: number = 0) {
  const today = new Date();
  let startDate: Date;
  let days: number;

  if (viewMode === 'month') {
    startDate = new Date(today.getFullYear(), today.getMonth() + weekOffset, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + weekOffset + 1, 0);
    days = lastDay.getDate();
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + weekOffset + 1, 0);
    const endDayOfWeek = endOfMonth.getDay();
    const daysAfterMonth = endDayOfWeek === 6 ? 0 : 6 - endDayOfWeek;
    days = startDayOfWeek + lastDay.getDate() + daysAfterMonth;
  } else {
    const weeksToShow = viewMode === '1week' ? 1 : 2;
    startDate = getMondayOfWeek(today);
    startDate.setDate(startDate.getDate() + weekOffset * 7);
    days = weeksToShow * 7;
  }

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + days - 1);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    startDatetime: startDate.toISOString(),
    endDatetime: endDate.toISOString(),
    days,
    displayMonth: viewMode === 'month' ? new Date(today.getFullYear(), today.getMonth() + weekOffset, 1) : null,
  };
}

function generateCalendarDates(startDate: string, days: number): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatDateHeader(date: Date): { day: string; date: string; fullDate: string; isToday: boolean; isWeekend: boolean } {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    isToday,
    isWeekend,
  };
}

function isDateInRange(date: Date, startStr: string, endStr: string): boolean {
  const dateOnly = new Date(date.toISOString().split('T')[0] + 'T00:00:00');
  const start = new Date(startStr.split('T')[0] + 'T00:00:00');
  const end = new Date(endStr.split('T')[0] + 'T00:00:00');
  return dateOnly >= start && dateOnly <= end;
}

function isSameDate(date: Date, dateStr: string): boolean {
  const dateOnly = date.toISOString().split('T')[0];
  const compareDate = dateStr.split('T')[0];
  return dateOnly === compareDate;
}

export function PersonScheduleView({ userId, displayName }: PersonScheduleViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('2weeks');
  const [weekOffset, setWeekOffset] = useState(0);
  const dateRange = useMemo(() => getDateRange(viewMode, weekOffset), [viewMode, weekOffset]);
  const calendarDates = useMemo(
    () => generateCalendarDates(dateRange.startDate, dateRange.days),
    [dateRange]
  );

  // Dashboard/Schedule data
  const { data: dashboardData, isLoading: scheduleLoading } = useDashboard(
    userId,
    dateRange.startDate,
    dateRange.endDate
  );

  // Hoteling Bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['person-bookings', userId, dateRange.startDatetime, dateRange.endDatetime],
    queryFn: () =>
      bookingsService.getAll({
        userId: userId,
        startDate: dateRange.startDatetime,
        endDate: dateRange.endDatetime,
      }),
    enabled: !!userId,
  });

  // Active DOA Letters for the visible date range
  const { data: doaLetters = [], isLoading: doasLoading } = useQuery({
    queryKey: ['person-doa-letters-range', userId, dateRange.startDate, dateRange.endDate],
    queryFn: () => doaService.getActiveLettersInRange(dateRange.startDate, dateRange.endDate),
    enabled: !!userId,
  });

  // Project Assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['person-project-assignments', userId],
    queryFn: () =>
      projectAssignmentsService.getAll({
        userId: userId,
        status: ProjectAssignmentStatus.Active,
      }),
    enabled: !!userId,
  });

  const isLoading = scheduleLoading || bookingsLoading || doasLoading || assignmentsLoading;

  const goToPrevious = () => {
    if (viewMode === 'month') {
      setWeekOffset((prev) => prev - 1);
    } else {
      setWeekOffset((prev) => prev - (viewMode === '1week' ? 1 : 2));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setWeekOffset((prev) => prev + 1);
    } else {
      setWeekOffset((prev) => prev + (viewMode === '1week' ? 1 : 2));
    }
  };

  const goToToday = () => {
    setWeekOffset(0);
  };

  const getSchedulesForDate = (date: Date) => {
    if (!dashboardData?.preferences) return [];
    return dashboardData.preferences.filter((p) => isSameDate(date, p.workDate));
  };

  const getBookingsForDate = (date: Date): Booking[] => {
    return bookings.filter((b) => isSameDate(date, b.startDatetime));
  };

  const getDOAsForDate = (date: Date): DelegationOfAuthorityLetter[] => {
    return doaLetters.filter((d: DelegationOfAuthorityLetter) =>
      isDateInRange(date, d.effectiveStartDate, d.effectiveEndDate)
    );
  };

  const getAssignmentsForDate = (date: Date): ProjectAssignment[] => {
    return assignments.filter((a) => {
      const endDate = a.endDate || '2099-12-31';
      return isDateInRange(date, a.startDate, endDate);
    });
  };

  const getDisplayTitle = () => {
    if (viewMode === 'month' && dateRange.displayMonth) {
      return dateRange.displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const startDate = new Date(dateRange.startDate + 'T00:00:00');
    const endDate = new Date(dateRange.endDate + 'T00:00:00');
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const isTodayInRange = calendarDates.some((d) => d.toDateString() === new Date().toDateString());

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{displayName}'s Schedule</h3>

        {/* Navigation & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPrevious}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              title={viewMode === 'month' ? 'Previous month' : 'Previous week(s)'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              disabled={isTodayInRange && weekOffset === 0}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                isTodayInRange && weekOffset === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              title={viewMode === 'month' ? 'Next month' : 'Next week(s)'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="ml-2 text-sm font-medium text-gray-700">{getDisplayTitle()}</span>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setViewMode('1week'); setWeekOffset(0); }}
              className={`px-2 py-1 text-xs rounded-md transition flex items-center gap-1 ${
                viewMode === '1week'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3 h-3" />
              1W
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('2weeks'); setWeekOffset(0); }}
              className={`px-2 py-1 text-xs rounded-md transition flex items-center gap-1 ${
                viewMode === '2weeks'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3 h-3" />
              2W
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('month'); setWeekOffset(0); }}
              className={`px-2 py-1 text-xs rounded-md transition flex items-center gap-1 ${
                viewMode === 'month'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Schedule
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Reservations
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-purple-500"></span> DOAs
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-orange-500"></span> Assignments
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : viewMode === 'month' ? (
          <MonthCalendarViewCompact
            calendarDates={calendarDates}
            getSchedulesForDate={getSchedulesForDate}
            getBookingsForDate={getBookingsForDate}
            getDOAsForDate={getDOAsForDate}
            getAssignmentsForDate={getAssignmentsForDate}
            displayMonth={dateRange.displayMonth}
            targetUserId={userId}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-24 p-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 sticky left-0 z-10">
                    Type
                  </th>
                  {calendarDates.map((date, idx) => {
                    const header = formatDateHeader(date);
                    return (
                      <th
                        key={idx}
                        className={`p-2 text-center min-w-[80px] ${
                          header.isToday
                            ? 'bg-emerald-50 border-x-2 border-emerald-400'
                            : header.isWeekend
                            ? 'bg-gray-100'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className={`text-xs font-medium ${header.isToday ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {header.day}
                        </div>
                        <div className={`text-xs font-bold ${header.isToday ? 'text-emerald-800' : 'text-gray-700'}`}>
                          {header.date}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Schedule Row */}
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2 bg-white sticky left-0 z-10 border-r border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Schedule
                    </div>
                  </td>
                  {calendarDates.map((date, idx) => {
                    const schedules = getSchedulesForDate(date);
                    const header = formatDateHeader(date);
                    return (
                      <td
                        key={idx}
                        className={`p-1 align-top ${
                          header.isToday ? 'border-x-2 border-emerald-400 bg-emerald-50/50' : ''
                        }`}
                      >
                        {schedules.length > 0 ? (
                          <div className="space-y-0.5">
                            {schedules.map((schedule, sIdx) => {
                              const portionLabel = getDayPortionLabel(schedule.dayPortion);
                              return (
                                <div
                                  key={sIdx}
                                  className={`px-1.5 py-0.5 rounded text-[10px] ${getScheduleColor(schedule.locationType)}`}
                                  title={`${getLocationLabel(schedule.locationType)}${portionLabel ? ` (${portionLabel})` : ''}`}
                                >
                                  <div className="font-medium truncate">
                                    {portionLabel && <span className="mr-0.5">{portionLabel}:</span>}
                                    {getLocationShort(schedule.locationType)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-center block text-xs">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Reservations Row */}
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2 bg-white sticky left-0 z-10 border-r border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Bookings
                    </div>
                  </td>
                  {calendarDates.map((date, idx) => {
                    const dayBookings = getBookingsForDate(date);
                    const header = formatDateHeader(date);
                    return (
                      <td
                        key={idx}
                        className={`p-1 align-top ${
                          header.isToday ? 'border-x-2 border-emerald-400 bg-emerald-50/50' : ''
                        }`}
                      >
                        {dayBookings.length > 0 ? (
                          <div className="space-y-0.5">
                            {dayBookings.slice(0, 2).map((booking, bIdx) => (
                              <div
                                key={bIdx}
                                className={`px-1.5 py-0.5 rounded text-[10px] ${getBookingStatusColor(booking.status)}`}
                                title={`${booking.space?.name || 'Booking'} - ${new Date(booking.startDatetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                              >
                                <div className="font-medium truncate">
                                  {new Date(booking.startDatetime).toLocaleTimeString('en-US', { hour: 'numeric' })}
                                </div>
                              </div>
                            ))}
                            {dayBookings.length > 2 && (
                              <div className="text-[9px] text-gray-500 text-center">+{dayBookings.length - 2}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-center block text-xs">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* DOAs Row */}
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2 bg-white sticky left-0 z-10 border-r border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      DOAs
                    </div>
                  </td>
                  {calendarDates.map((date, idx) => {
                    const dayDOAs = getDOAsForDate(date);
                    const header = formatDateHeader(date);
                    return (
                      <td
                        key={idx}
                        className={`p-1 align-top ${
                          header.isToday ? 'border-x-2 border-emerald-400 bg-emerald-50/50' : ''
                        }`}
                      >
                        {dayDOAs.length > 0 ? (
                          <div className="space-y-0.5">
                            {dayDOAs.slice(0, 2).map((doa, dIdx) => {
                              const isDesignee = doa.designeeUserId === userId;
                              const displayText = isDesignee ? 'Acting' : (doa.subjectLine || 'Out');
                              return (
                                <div
                                  key={dIdx}
                                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                                    isDesignee ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                  title={doa.subjectLine || 'DOA'}
                                >
                                  <div className="font-medium truncate">{displayText}</div>
                                </div>
                              );
                            })}
                            {dayDOAs.length > 2 && (
                              <div className="text-[9px] text-gray-500 text-center">+{dayDOAs.length - 2}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-center block text-xs">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Assignments Row */}
                <tr className="hover:bg-gray-50">
                  <td className="p-2 bg-white sticky left-0 z-10 border-r border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      Projects
                    </div>
                  </td>
                  {calendarDates.map((date, idx) => {
                    const dayAssignments = getAssignmentsForDate(date);
                    const header = formatDateHeader(date);
                    return (
                      <td
                        key={idx}
                        className={`p-1 align-top ${
                          header.isToday ? 'border-x-2 border-emerald-400 bg-emerald-50/50' : ''
                        }`}
                      >
                        {dayAssignments.length > 0 ? (
                          <div
                            className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 text-orange-800"
                            title={`${dayAssignments.length} active assignment(s)`}
                          >
                            <div className="font-medium text-center">{dayAssignments.length}</div>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-center block text-xs">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-blue-600">
            {(dashboardData?.stats?.officeDays ?? 0) + (dashboardData?.stats?.remoteDays ?? 0)}
          </div>
          <div className="text-xs text-gray-500">Schedule</div>
        </div>
        <div>
          <div className="text-lg font-bold text-emerald-600">
            {bookings.filter((b) => b.status === BookingStatus.Reserved).length}
          </div>
          <div className="text-xs text-gray-500">Bookings</div>
        </div>
        <div>
          <div className="text-lg font-bold text-purple-600">{doaLetters.length}</div>
          <div className="text-xs text-gray-500">DOAs</div>
        </div>
        <div>
          <div className="text-lg font-bold text-orange-600">{assignments.length}</div>
          <div className="text-xs text-gray-500">Projects</div>
        </div>
      </div>
    </div>
  );
}

// Month Calendar View Component (Compact version)
interface MonthCalendarViewCompactProps {
  calendarDates: Date[];
  getSchedulesForDate: (date: Date) => { locationType: number; dayPortion: number; office?: { name: string } }[];
  getBookingsForDate: (date: Date) => Booking[];
  getDOAsForDate: (date: Date) => DelegationOfAuthorityLetter[];
  getAssignmentsForDate: (date: Date) => ProjectAssignment[];
  displayMonth: Date | null;
  targetUserId: string;
}

function MonthCalendarViewCompact({
  calendarDates,
  getSchedulesForDate,
  getBookingsForDate,
  getDOAsForDate,
  getAssignmentsForDate,
  displayMonth,
  targetUserId,
}: MonthCalendarViewCompactProps) {
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDates.length; i += 7) {
    weeks.push(calendarDates.slice(i, i + 7));
  }

  const isCurrentMonth = (date: Date) => {
    if (!displayMonth) return true;
    return date.getMonth() === displayMonth.getMonth();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <th key={day} className="p-1.5 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 w-[14.28%]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIdx) => (
            <tr key={weekIdx} className="border-b border-gray-100">
              {week.map((date, dayIdx) => {
                const header = formatDateHeader(date);
                const schedules = getSchedulesForDate(date);
                const dayBookings = getBookingsForDate(date);
                const dayDOAs = getDOAsForDate(date);
                const dayAssignments = getAssignmentsForDate(date);
                const inCurrentMonth = isCurrentMonth(date);

                return (
                  <td
                    key={dayIdx}
                    className={`p-1 align-top min-h-[80px] h-20 ${
                      header.isToday
                        ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-400'
                        : header.isWeekend
                        ? 'bg-gray-50'
                        : ''
                    } ${!inCurrentMonth ? 'opacity-40' : ''}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`text-xs font-bold mb-0.5 ${header.isToday ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {date.getDate()}
                      </div>
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {schedules.slice(0, 1).map((schedule, sIdx) => (
                          <div
                            key={`s-${sIdx}`}
                            className={`px-1 py-0.5 rounded text-[9px] truncate ${getScheduleColor(schedule.locationType)}`}
                          >
                            {getLocationShort(schedule.locationType)}
                          </div>
                        ))}
                        {dayBookings.slice(0, 1).map((booking, bIdx) => (
                          <div
                            key={`b-${bIdx}`}
                            className={`px-1 py-0.5 rounded text-[9px] truncate ${getBookingStatusColor(booking.status)}`}
                          >
                            {new Date(booking.startDatetime).toLocaleTimeString('en-US', { hour: 'numeric' })}
                          </div>
                        ))}
                        {dayDOAs.slice(0, 1).map((doa, dIdx) => {
                          const isDesignee = doa.designeeUserId === targetUserId;
                          return (
                            <div
                              key={`d-${dIdx}`}
                              className={`px-1 py-0.5 rounded text-[9px] truncate ${
                                isDesignee ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {isDesignee ? 'Acting' : (doa.subjectLine || 'Out')}
                            </div>
                          );
                        })}
                        {dayAssignments.length > 0 && (
                          <div className="px-1 py-0.5 rounded text-[9px] truncate bg-orange-100 text-orange-800">
                            {dayAssignments.length} proj
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper functions
function getScheduleColor(locationType: number): string {
  switch (locationType) {
    case 0: case 1: return 'bg-blue-100 text-blue-800';
    case 2: return 'bg-orange-100 text-orange-800';
    case 3: case 4: return 'bg-green-100 text-green-800';
    case 5: return 'bg-amber-100 text-amber-800';
    case 6: return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getLocationShort(locationType: number): string {
  switch (locationType) {
    case 0: return 'Remote';
    case 1: return 'Remote+';
    case 2: return 'Client';
    case 3: case 4: return 'Office';
    case 5: return 'PTO';
    case 6: return 'Travel';
    default: return '-';
  }
}

function getLocationLabel(locationType: number): string {
  switch (locationType) {
    case 0: return 'Remote';
    case 1: return 'Remote Plus';
    case 2: return 'Client Site';
    case 3: return 'In Office';
    case 4: return 'In Office (Reserved)';
    case 5: return 'PTO';
    case 6: return 'Travel';
    default: return 'Unknown';
  }
}

function getDayPortionLabel(dayPortion: number): string {
  switch (dayPortion) {
    case 1: return 'AM';
    case 2: return 'PM';
    default: return '';
  }
}

function getBookingStatusColor(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.Reserved: return 'bg-emerald-100 text-emerald-800';
    case BookingStatus.CheckedIn: return 'bg-green-100 text-green-800';
    case BookingStatus.Completed: return 'bg-gray-100 text-gray-800';
    case BookingStatus.Cancelled: return 'bg-red-100 text-red-800';
    case BookingStatus.NoShow: return 'bg-amber-100 text-amber-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default PersonScheduleView;
