import { useState, useMemo } from 'react';
import { Modal, Button } from './ui';
import { WorkLocationType, type WorkLocationPreference, type User } from '../types/api';

interface ShareCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: WorkLocationPreference[];
  user: User;
  startDate: string;
  endDate: string;
}

export function ShareCalendarModal({
  isOpen,
  onClose,
  preferences,
  user,
  startDate,
  endDate,
}: ShareCalendarModalProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'detailed' | 'summary'>('detailed');

  const getLocationTypeLabel = (type: WorkLocationType): string => {
    switch (type) {
      case WorkLocationType.Remote:
        return 'Remote';
      case WorkLocationType.RemotePlus:
        return 'Remote Plus';
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

  const getLocationEmoji = (type: WorkLocationType): string => {
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

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const generatedContent = useMemo(() => {
    // Sort preferences by date
    const sortedPrefs = [...preferences]
      .filter(p => p.userId === user.id)
      .sort((a, b) => a.workDate.localeCompare(b.workDate));

    const displayName = user.displayName || `${user.firstName} ${user.lastName}`;
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    if (format === 'detailed') {
      let content = `Work Location Schedule for ${displayName}\n`;
      content += `═══════════════════════════════════════════════════\n`;
      content += `Period: ${formattedStartDate} - ${formattedEndDate}\n\n`;

      if (sortedPrefs.length === 0) {
        content += `No work locations have been set for this period.\n`;
      } else {
        // Group by week
        let currentWeek = -1;
        sortedPrefs.forEach((pref) => {
          const date = new Date(pref.workDate + 'T00:00:00');
          const weekNumber = getWeekNumber(date);

          if (weekNumber !== currentWeek) {
            currentWeek = weekNumber;
            content += `\n📅 Week of ${getWeekStartDate(date)}\n`;
            content += `───────────────────────────────────────────────────\n`;
          }

          const emoji = getLocationEmoji(pref.locationType);
          const label = getLocationTypeLabel(pref.locationType);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          content += `${emoji} ${dayName}, ${dateStr}: ${label}`;

          // Add additional details
          if (pref.office?.name) {
            content += ` - ${pref.office.name}`;
            if (pref.office.city && pref.office.stateCode) {
              content += ` (${pref.office.city}, ${pref.office.stateCode})`;
            }
          }
          if (pref.remoteLocation) {
            content += ` - ${pref.remoteLocation}`;
            if (pref.city || pref.state) {
              const location = [pref.city, pref.state].filter(Boolean).join(', ');
              content += ` (${location})`;
            }
          }
          if (pref.notes) {
            content += `\n   📝 Note: ${pref.notes}`;
          }
          content += '\n';
        });
      }

      content += `\n═══════════════════════════════════════════════════\n`;
      content += `Generated from MyScheduling on ${new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}\n`;

      return content;
    } else {
      // Summary format - more compact
      let content = `📆 ${displayName}'s Work Schedule\n`;
      content += `${formatShortDate(startDate)} - ${formatShortDate(endDate)}\n\n`;

      if (sortedPrefs.length === 0) {
        content += `No locations set.\n`;
      } else {
        sortedPrefs.forEach((pref) => {
          const emoji = getLocationEmoji(pref.locationType);
          const label = getLocationTypeLabel(pref.locationType);
          const dateStr = formatShortDate(pref.workDate);

          let line = `${emoji} ${dateStr}: ${label}`;
          if (pref.office?.name) {
            line += ` @ ${pref.office.name}`;
          }
          if (pref.remoteLocation) {
            line += ` @ ${pref.remoteLocation}`;
          }
          content += line + '\n';
        });
      }

      return content;
    }
  }, [preferences, user, startDate, endDate, format]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = generatedContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent(`Work Location Schedule - ${user.displayName || user.firstName}`);
    const body = encodeURIComponent(generatedContent);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Work Location Schedule"
      size="lg"
    >
      <div className="space-y-4">
        {/* Format Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setFormat('detailed')}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all
              ${format === 'detailed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Detailed
          </button>
          <button
            type="button"
            onClick={() => setFormat('summary')}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all
              ${format === 'summary'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Summary
          </button>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-white p-4 rounded border border-gray-200 max-h-80 overflow-y-auto">
            {generatedContent}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to Clipboard
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            onClick={handleEmailClick}
            className="flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Open in Email Client
          </Button>

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Future: Direct email sending from the app will be available soon.
        </p>
      </div>
    </Modal>
  );
}

// Helper functions
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getWeekStartDate(date: Date): string {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  return monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export default ShareCalendarModal;
