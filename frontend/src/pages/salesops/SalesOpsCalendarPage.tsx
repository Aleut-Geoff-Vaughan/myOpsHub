import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Target,
  Rocket,
  Flag,
  Play,
  CheckCircle,
  Loader2,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from 'date-fns';
import { useOpportunities, useStages, useAccounts } from '../../hooks/useSalesOps';

// Date event types for the calendar
interface CalendarEvent {
  id: string;
  opportunityId: string;
  opportunityName: string;
  opportunityNumber: string;
  date: string;
  type: EventType;
  stageName: string;
  stageColor?: string;
  accountName?: string;
  amount: number;
}

type EventType =
  | 'closeDate'
  | 'plannedRfiSubmission'
  | 'actualRfiSubmission'
  | 'plannedRfpRelease'
  | 'actualRfpRelease'
  | 'plannedProposalSubmission'
  | 'actualProposalSubmission'
  | 'projectStart'
  | 'projectFinish';

const EVENT_CONFIG: Record<EventType, { label: string; shortLabel: string; color: string; bgColor: string; icon: typeof Calendar }> = {
  closeDate: { label: 'Close Date', shortLabel: 'Close', color: 'text-green-700', bgColor: 'bg-green-100', icon: Target },
  plannedRfiSubmission: { label: 'RFI Submission (Planned)', shortLabel: 'RFI Plan', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: FileText },
  actualRfiSubmission: { label: 'RFI Submission (Actual)', shortLabel: 'RFI', color: 'text-blue-800', bgColor: 'bg-blue-200', icon: FileText },
  plannedRfpRelease: { label: 'RFP Release (Planned)', shortLabel: 'RFP Plan', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Rocket },
  actualRfpRelease: { label: 'RFP Release (Actual)', shortLabel: 'RFP', color: 'text-purple-800', bgColor: 'bg-purple-200', icon: Rocket },
  plannedProposalSubmission: { label: 'Proposal Due (Planned)', shortLabel: 'Prop Plan', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Flag },
  actualProposalSubmission: { label: 'Proposal Submitted', shortLabel: 'Proposal', color: 'text-orange-800', bgColor: 'bg-orange-200', icon: Flag },
  projectStart: { label: 'Project Start', shortLabel: 'Start', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: Play },
  projectFinish: { label: 'Project Finish', shortLabel: 'Finish', color: 'text-red-700', bgColor: 'bg-red-100', icon: CheckCircle },
};

export function SalesOpsCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<EventType>>(
    new Set(['closeDate', 'plannedProposalSubmission', 'actualProposalSubmission', 'plannedRfpRelease', 'projectStart'])
  );
  const [showFilters, setShowFilters] = useState(false);

  // Opportunity filters
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');

  // Fetch filter options
  const { data: stages } = useStages();
  const { data: accounts } = useAccounts();

  // Fetch all opportunities (increase take to get more for calendar view)
  const { data: opportunities, isLoading } = useOpportunities({ take: 500 });

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // Add padding days for the beginning of the month
    const startDay = getDay(start);
    const paddingDays = startDay === 0 ? 6 : startDay - 1; // Monday = 0

    return { days, paddingDays };
  }, [currentDate]);

  // Get unique owners from opportunities
  const owners = useMemo(() => {
    if (!opportunities?.items) return [];
    const ownerMap = new Map<string, { id: string; name: string }>();
    opportunities.items.forEach((opp) => {
      if (opp.ownerId && opp.ownerName) {
        ownerMap.set(opp.ownerId, { id: opp.ownerId, name: opp.ownerName });
      }
    });
    return Array.from(ownerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [opportunities]);

  // Filter opportunities based on selected filters
  const filteredOpportunities = useMemo(() => {
    if (!opportunities?.items) return [];
    return opportunities.items.filter((opp) => {
      if (selectedStageId && opp.stageId !== selectedStageId) return false;
      if (selectedAccountId && opp.accountId !== selectedAccountId) return false;
      if (selectedOwnerId && opp.ownerId !== selectedOwnerId) return false;
      return true;
    });
  }, [opportunities, selectedStageId, selectedAccountId, selectedOwnerId]);

  // Extract calendar events from filtered opportunities
  const calendarEvents = useMemo(() => {
    if (!filteredOpportunities.length) return [];

    const events: CalendarEvent[] = [];

    filteredOpportunities.forEach((opp) => {
      const addEvent = (date: string | undefined, type: EventType) => {
        if (date && visibleEventTypes.has(type)) {
          events.push({
            id: `${opp.id}-${type}`,
            opportunityId: opp.id,
            opportunityName: opp.name,
            opportunityNumber: opp.opportunityNumber,
            date,
            type,
            stageName: opp.stageName,
            stageColor: opp.stageColor,
            accountName: opp.accountName,
            amount: opp.amount,
          });
        }
      };

      addEvent(opp.closeDate, 'closeDate');
      addEvent(opp.plannedRfiSubmissionDate, 'plannedRfiSubmission');
      addEvent(opp.actualRfiSubmissionDate, 'actualRfiSubmission');
      addEvent(opp.plannedRfpReleaseDate, 'plannedRfpRelease');
      addEvent(opp.actualRfpReleaseDate, 'actualRfpRelease');
      addEvent(opp.plannedProposalSubmissionDate, 'plannedProposalSubmission');
      addEvent(opp.actualProposalSubmissionDate, 'actualProposalSubmission');
      addEvent(opp.projectStartDate, 'projectStart');
      addEvent(opp.projectFinishDate, 'projectFinish');
    });

    return events;
  }, [filteredOpportunities, visibleEventTypes]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarEvents.filter((e) => e.date.startsWith(dateStr));
  };

  // Get events for the selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Navigation handlers
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Toggle event type visibility
  const toggleEventType = (type: EventType) => {
    setVisibleEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Count active filters
  const activeFilterCount = [selectedStageId, selectedAccountId, selectedOwnerId].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setSelectedStageId('');
    setSelectedAccountId('');
    setSelectedOwnerId('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            View key dates, deadlines, and milestones for all opportunities
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border ${
            showFilters || activeFilterCount > 0
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filter Events
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-orange-500 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          {/* Opportunity Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Filter Opportunities</h3>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-orange-600 hover:text-orange-700"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stage Filter */}
              <div>
                <label htmlFor="stage-filter" className="block text-xs font-medium text-gray-500 mb-1">
                  Stage
                </label>
                <select
                  id="stage-filter"
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Stages</option>
                  {stages?.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Filter */}
              <div>
                <label htmlFor="account-filter" className="block text-xs font-medium text-gray-500 mb-1">
                  Account
                </label>
                <select
                  id="account-filter"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Accounts</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Owner Filter */}
              <div>
                <label htmlFor="owner-filter" className="block text-xs font-medium text-gray-500 mb-1">
                  Owner
                </label>
                <select
                  id="owner-filter"
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Owners</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Showing {filteredOpportunities.length} of {opportunities?.items?.length || 0} opportunities
              </p>
            )}
          </div>

          {/* Event Type Filters */}
          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Show Event Types</h3>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleEventType(type)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    visibleEventTypes.has(type)
                      ? `${config.bgColor} ${config.color} border-current`
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {visibleEventTypes.has(type) ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Today
              </button>
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Padding cells for days before the month starts */}
            {Array.from({ length: calendarDays.paddingDays }).map((_, i) => (
              <div key={`padding-${i}`} className="h-24 bg-gray-50 rounded" />
            ))}

            {/* Month days */}
            {calendarDays.days.map((date) => {
              const dayEvents = getEventsForDate(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const today = isToday(date);

              return (
                <button
                  type="button"
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`h-16 sm:h-24 p-1 rounded border text-left transition-colors overflow-hidden ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50'
                      : today
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-transparent hover:bg-gray-50'
                  } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${today ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-0.5 overflow-hidden hidden sm:block">
                    {dayEvents.slice(0, 3).map((event) => {
                      const config = EVENT_CONFIG[event.type];
                      return (
                        <div
                          key={event.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${config.bgColor} ${config.color}`}
                          title={`${event.opportunityName} - ${config.label}`}
                        >
                          {config.shortLabel}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-gray-500 px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                  {/* Mobile: just show a dot indicator */}
                  {dayEvents.length > 0 && (
                    <div className="sm:hidden flex gap-0.5 justify-center mt-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const config = EVENT_CONFIG[event.type];
                        return (
                          <div
                            key={event.id}
                            className={`w-1.5 h-1.5 rounded-full ${config.bgColor}`}
                          />
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
          </h3>

          {selectedDate ? (
            selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => {
                  const config = EVENT_CONFIG[event.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border ${config.bgColor} border-current/20`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded ${config.bgColor} ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium ${config.color}`}>
                            {config.label}
                          </div>
                          <Link
                            to={`/salesops/opportunities/${event.opportunityId}`}
                            className="text-sm font-medium text-gray-900 hover:text-orange-600 line-clamp-2"
                          >
                            {event.opportunityName}
                          </Link>
                          <div className="text-xs text-gray-500 mt-1">
                            {event.opportunityNumber}
                            {event.accountName && ` • ${event.accountName}`}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="inline-block px-1.5 py-0.5 text-[10px] rounded"
                              style={{ backgroundColor: event.stageColor || '#E5E7EB' }}
                            >
                              {event.stageName}
                            </span>
                            <span className="text-xs text-gray-600">
                              {formatCurrency(event.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No events on this date</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm">Click a date to view events</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`p-1 rounded ${config.bgColor} ${config.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <span className="text-gray-600">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SalesOpsCalendarPage;
