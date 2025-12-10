import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { facilitiesPortalService } from '../../services/facilitiesPortalService';
import type { LeaseCalendarItem } from '../../services/facilitiesPortalService';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, getDay } from 'date-fns';

function getEventTypeColor(type: string): { bg: string; text: string; border: string } {
  switch (type.toLowerCase()) {
    case 'expiration':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
    case 'option_deadline':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
    case 'notification':
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' };
    case 'renewal':
      return { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' };
    case 'rent_increase':
      return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
  }
}

function getEventTypeLabel(type: string): string {
  switch (type.toLowerCase()) {
    case 'expiration': return 'Expiration';
    case 'option_deadline': return 'Option Deadline';
    case 'notification': return 'Notification';
    case 'renewal': return 'Renewal';
    case 'rent_increase': return 'Rent Increase';
    default: return type;
  }
}

export function OptionYearsCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const year = currentDate.getFullYear();

  const { data: calendarEvents = [], isLoading } = useQuery({
    queryKey: ['lease-calendar', year],
    queryFn: () => facilitiesPortalService.getLeaseCalendar(year),
  });

  // Get days for current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for calendar grid
  const startPadding = getDay(monthStart); // 0 = Sunday
  const paddingDays = startPadding;

  // Get events for a specific date
  const getEventsForDate = (date: Date): LeaseCalendarItem[] => {
    return calendarEvents.filter(event =>
      isSameDay(parseISO(event.date), date)
    );
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Get upcoming events (next 90 days)
  const today = new Date();
  const upcomingEvents = calendarEvents
    .filter(event => {
      const eventDate = parseISO(event.date);
      const daysUntil = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 90;
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  // Navigate months
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/facilities/leases" className="hover:text-teal-600">Leases</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900">Option Years Calendar</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Option Years Calendar</h1>
          <p className="text-gray-600 mt-1">Track lease expirations, option deadlines, and important dates</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            {viewMode === 'calendar' ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List View
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar View
              </>
            )}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <span className="text-sm font-medium text-gray-700">Legend:</span>
        {['expiration', 'option_deadline', 'notification', 'renewal', 'rent_increase'].map(type => {
          const colors = getEventTypeColor(type);
          return (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.bg} border ${colors.border}`}></div>
              <span className="text-sm text-gray-600">{getEventTypeLabel(type)}</span>
            </div>
          );
        })}
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition"
              >
                Today
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Padding days */}
                {Array.from({ length: paddingDays }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square"></div>
                ))}

                {/* Month days */}
                {monthDays.map(day => {
                  const dayEvents = getEventsForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`aspect-square p-1 rounded-lg transition relative ${
                        isSelected
                          ? 'bg-teal-100 ring-2 ring-teal-600'
                          : isTodayDate
                          ? 'bg-teal-50'
                          : 'hover:bg-gray-50'
                      } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    >
                      <span className={`text-sm ${
                        isSelected ? 'font-semibold text-teal-900' :
                        isTodayDate ? 'font-semibold text-teal-600' :
                        'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event, i) => {
                            const colors = getEventTypeColor(event.type);
                            return (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${colors.bg} border ${colors.border}`}
                              ></div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="text-xs text-gray-500">+</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
              </h3>
            </div>
            <div className="p-4">
              {!selectedDate ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Click on a date to see events
                </p>
              ) : selectedDateEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No events on this date
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((event, i) => {
                    const colors = getEventTypeColor(event.type);
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className={`text-xs font-medium ${colors.text}`}>
                              {getEventTypeLabel(event.type)}
                            </span>
                            <p className="font-medium text-gray-900 mt-1">{event.title}</p>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/facilities/leases/${event.leaseId}`}
                          className="mt-2 inline-flex items-center text-sm text-teal-600 hover:text-teal-700"
                        >
                          View Lease
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Events in {year}</h2>
          </div>
          {calendarEvents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">No events this year</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {calendarEvents.map((event, i) => {
                const colors = getEventTypeColor(event.type);
                const eventDate = parseISO(event.date);
                const isPast = eventDate < today;
                return (
                  <div key={i} className={`px-6 py-4 flex items-center gap-4 ${isPast ? 'opacity-50' : ''}`}>
                    <div className="flex-shrink-0 w-16 text-center">
                      <p className="text-2xl font-bold text-gray-900">{format(eventDate, 'd')}</p>
                      <p className="text-sm text-gray-500">{format(eventDate, 'MMM')}</p>
                    </div>
                    <div className={`w-1 h-12 rounded-full ${colors.bg} border ${colors.border}`}></div>
                    <div className="flex-1 min-w-0">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                      <p className="font-medium text-gray-900 mt-1 truncate">{event.title}</p>
                      <p className="text-sm text-gray-500 truncate">{event.leaseName}</p>
                    </div>
                    <Link
                      to={`/facilities/leases/${event.leaseId}`}
                      className="flex-shrink-0 text-teal-600 hover:text-teal-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Events Alert */}
      {upcomingEvents.length > 0 && viewMode === 'calendar' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900">Upcoming Events (Next 90 Days)</h3>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {upcomingEvents.slice(0, 6).map((event, i) => {
                  const colors = getEventTypeColor(event.type);
                  return (
                    <Link
                      key={i}
                      to={`/facilities/leases/${event.leaseId}`}
                      className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 hover:shadow-sm transition"
                    >
                      <div className={`w-2 h-2 rounded-full ${colors.bg} border ${colors.border}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">{format(parseISO(event.date), 'MMM d, yyyy')}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {upcomingEvents.length > 6 && (
                <button
                  onClick={() => setViewMode('list')}
                  className="mt-3 text-sm text-yellow-700 hover:text-yellow-800 font-medium"
                >
                  View all {upcomingEvents.length} upcoming events →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
