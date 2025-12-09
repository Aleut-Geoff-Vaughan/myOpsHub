import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useMyExpiringCertifications } from '../../hooks/useExpiringCertifications';
import { getUrgencyColor } from '../../services/expiringCertificationsService';

export function ExpiringCertificationsWidget() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyExpiringCertifications();

  if (isLoading) {
    return (
      <Card>
        <div className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-5 bg-gray-200 rounded w-1/3" />
            </div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-100 rounded" />
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return null;
  }

  if (!data || data.items.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Expiring Certifications</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/resumes')}
            className="text-blue-600"
          >
            View All
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {data.items.map((cert) => (
            <div
              key={cert.id}
              className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(cert.urgencyLevel)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{cert.certificationName}</p>
                  <p className="text-sm text-gray-600">{cert.issuer || 'Unknown issuer'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">
                    {cert.daysRemaining < 0
                      ? 'Expired'
                      : cert.daysRemaining === 0
                      ? 'Expires today'
                      : `${cert.daysRemaining} days`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(cert.expiryDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.totalCount > data.items.length && (
          <p className="mt-4 text-sm text-center text-gray-500">
            Showing {data.items.length} of {data.totalCount} expiring certifications
          </p>
        )}
      </div>
    </Card>
  );
}
