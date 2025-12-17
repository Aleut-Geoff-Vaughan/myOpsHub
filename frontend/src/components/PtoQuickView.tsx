import { useMemo } from 'react';
import type { TeamMemberSchedule } from '../types/teamCalendar';
import { WorkLocationType } from '../types/api';

interface PtoQuickViewProps {
  memberSchedules: TeamMemberSchedule[];
  startDate: Date;
  endDate: Date;
  managerName?: string;
  teamName?: string;
}

interface PtoEntry {
  userId: string;
  userName: string;
  userEmail?: string;
  type: 'PTO' | 'Holiday';
  startDate: string;
  endDate: string;
  totalDays: number;
}

// Helper to check if a date is a weekend
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Helper to get next business day
function getNextBusinessDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// Helper to format date as YYYY-MM-DD
function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to format date for display
function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Helper to format date range
function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatDisplayDate(startDate);
  }

  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  // If same month
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}`;
  }

  // Different months
  return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
}

// Count business days between two dates (inclusive)
function countBusinessDays(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export function PtoQuickView({ memberSchedules, startDate, endDate, managerName, teamName }: PtoQuickViewProps) {
  // Group entries by user
  interface UserPtoGroup {
    userId: string;
    userName: string;
    userEmail?: string;
    entries: Omit<PtoEntry, 'userId' | 'userName' | 'userEmail'>[];
    totalDays: number;
  }

  // Build the PTO entries with consolidated date ranges, grouped by user
  const userPtoGroups = useMemo((): UserPtoGroup[] => {
    const userMap = new Map<string, UserPtoGroup>();
    const viewStartStr = formatDateStr(startDate);
    const viewEndStr = formatDateStr(endDate);

    for (const member of memberSchedules) {
      // Get all PTO and Holiday preferences, sorted by date
      const ptoPrefs = member.preferences
        .filter(p => p.locationType === WorkLocationType.PTO || p.locationType === WorkLocationType.Holiday)
        .sort((a, b) => a.workDate.localeCompare(b.workDate));

      if (ptoPrefs.length === 0) continue;

      // Initialize user group if not exists
      if (!userMap.has(member.userId)) {
        userMap.set(member.userId, {
          userId: member.userId,
          userName: member.userName,
          userEmail: member.userEmail,
          entries: [],
          totalDays: 0,
        });
      }
      const userGroup = userMap.get(member.userId)!;

      // Group consecutive PTO days (weekends don't break the streak)
      let currentRange: { start: string; end: string; type: WorkLocationType } | null = null;

      for (const pref of ptoPrefs) {
        // Only process preferences that fall within or start in the view range
        if (pref.workDate < viewStartStr) continue;
        if (pref.workDate > viewEndStr) {
          // This preference is after the view range
          // But we need to keep extending if it's consecutive with current range
          if (currentRange) {
            const lastDate = new Date(currentRange.end + 'T00:00:00');
            const expectedNext = getNextBusinessDay(lastDate);

            // If this PTO is the next business day and same type, extend the range
            if (formatDateStr(expectedNext) === pref.workDate && pref.locationType === currentRange.type) {
              currentRange.end = pref.workDate;
              continue;
            }
          }
          break;
        }

        if (!currentRange) {
          // Start a new range
          currentRange = { start: pref.workDate, end: pref.workDate, type: pref.locationType };
        } else {
          // Check if this is consecutive (next business day) and same type
          const lastDate = new Date(currentRange.end + 'T00:00:00');
          const expectedNext = getNextBusinessDay(lastDate);

          if (formatDateStr(expectedNext) === pref.workDate && pref.locationType === currentRange.type) {
            // Extend current range
            currentRange.end = pref.workDate;
          } else {
            // Save current range and start new one
            const days = countBusinessDays(currentRange.start, currentRange.end);
            userGroup.entries.push({
              type: currentRange.type === WorkLocationType.PTO ? 'PTO' : 'Holiday',
              startDate: currentRange.start,
              endDate: currentRange.end,
              totalDays: days,
            });
            userGroup.totalDays += days;
            currentRange = { start: pref.workDate, end: pref.workDate, type: pref.locationType };
          }
        }
      }

      // Don't forget the last range
      if (currentRange) {
        // Look ahead beyond view range for consecutive PTO
        const futurePrefs = member.preferences
          .filter(p =>
            p.workDate > viewEndStr &&
            (p.locationType === WorkLocationType.PTO || p.locationType === WorkLocationType.Holiday)
          )
          .sort((a, b) => a.workDate.localeCompare(b.workDate));

        for (const pref of futurePrefs) {
          const lastDate = new Date(currentRange.end + 'T00:00:00');
          const expectedNext = getNextBusinessDay(lastDate);

          if (formatDateStr(expectedNext) === pref.workDate && pref.locationType === currentRange.type) {
            currentRange.end = pref.workDate;
          } else {
            break;
          }
        }

        const days = countBusinessDays(currentRange.start, currentRange.end);
        userGroup.entries.push({
          type: currentRange.type === WorkLocationType.PTO ? 'PTO' : 'Holiday',
          startDate: currentRange.start,
          endDate: currentRange.end,
          totalDays: days,
        });
        userGroup.totalDays += days;
      }
    }

    // Sort users by name, then sort each user's entries by start date
    const groups = Array.from(userMap.values());
    groups.sort((a, b) => a.userName.localeCompare(b.userName));
    groups.forEach(g => g.entries.sort((a, b) => a.startDate.localeCompare(b.startDate)));
    return groups;
  }, [memberSchedules, startDate, endDate]);

  // Flatten for legacy code compatibility (count total entries)
  const totalEntries = userPtoGroups.reduce((sum, g) => sum + g.entries.length, 0);

  if (userPtoGroups.length === 0) {
    return null;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const viewPeriod = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg shadow-sm">
      {/* Header - Executive Style */}
      <div className="px-6 py-4 border-b border-amber-200 bg-gradient-to-r from-amber-100/50 to-yellow-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow">
              <span className="text-xl">🌴</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Time Off Summary</h3>
              <p className="text-sm text-gray-600">
                {teamName || managerName ? `${teamName || `${managerName}'s Team`} • ` : ''}
                {viewPeriod}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div className="font-medium">Generated</div>
            <div>{currentDate}</div>
          </div>
        </div>
      </div>

      {/* Table - Grouped by User */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-amber-100/50 text-left">
              <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Team Member
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Time Off Details
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">
                Total Days
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {userPtoGroups.map((group) => (
              <tr
                key={group.userId}
                className="hover:bg-amber-50/50 transition-colors align-top"
              >
                <td className="px-6 py-3">
                  <div className="font-medium text-gray-900">{group.userName}</div>
                  {group.userEmail && (
                    <div className="text-xs text-gray-500">{group.userEmail}</div>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="space-y-2">
                    {group.entries.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className={`
                          inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                          ${entry.type === 'PTO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }
                        `}>
                          {entry.type === 'PTO' ? '🌴' : '🎉'} {entry.type}
                        </span>
                        <span className="text-sm text-gray-900">
                          {formatDateRange(entry.startDate, entry.endDate)}
                          {entry.endDate > formatDateStr(endDate) && (
                            <span className="ml-2 text-xs text-amber-600 font-medium">
                              (extends beyond view)
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({entry.totalDays} {entry.totalDays === 1 ? 'day' : 'days'})
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold text-lg">
                    {group.totalDays}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-amber-100/30 border-t border-amber-200 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {totalEntries} time off {totalEntries === 1 ? 'entry' : 'entries'} •
          {' '}{userPtoGroups.length} team {userPtoGroups.length === 1 ? 'member' : 'members'}
        </div>
        <div className="text-xs text-gray-400 italic">
          myScheduling Platform
        </div>
      </div>
    </div>
  );
}
