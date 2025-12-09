import { AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { useMyExpiringCertifications } from '../../hooks/useExpiringCertifications';
import { getUrgencyBadgeColor } from '../../services/expiringCertificationsService';

export function ExpiringCertificationsCompact() {
  const { data, isLoading, error } = useMyExpiringCertifications();

  if (isLoading) {
    return (
      <Card>
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  if (data.items.length === 0) {
    return null;
  }

  // Show at most 3 items in compact view
  const displayItems = data.items.slice(0, 3);
  const hasMore = data.items.length > 3;

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900">Expiring Certifications</h3>
        </div>

        <div className="space-y-2">
          {displayItems.map((cert) => (
            <div key={cert.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${getUrgencyBadgeColor(
                    cert.urgencyLevel
                  )}`}
                />
                <span className="text-sm text-gray-900 truncate">{cert.certificationName}</span>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {cert.daysRemaining < 0
                  ? 'Expired'
                  : cert.daysRemaining === 0
                  ? 'Today'
                  : `${cert.daysRemaining}d`}
              </span>
            </div>
          ))}
        </div>

        {hasMore && (
          <p className="mt-2 text-xs text-gray-500">
            +{data.items.length - 3} more expiring within {data.warningDays} days
          </p>
        )}
      </div>
    </Card>
  );
}
