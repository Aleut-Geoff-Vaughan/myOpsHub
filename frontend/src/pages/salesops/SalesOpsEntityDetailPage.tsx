import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  FileText,
  Trash2,
} from 'lucide-react';
import { useBiddingEntity, useDeleteBiddingEntity } from '../../hooks/useSalesOps';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Badge component for certifications
function CertBadge({
  label,
  active,
  fullName,
}: {
  label: string;
  active: boolean;
  fullName: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
        active
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-gray-50 border-gray-200 text-gray-400'
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400" />
      )}
      <div>
        <span className="font-medium">{label}</span>
        <span className="text-xs ml-1">({fullName})</span>
      </div>
    </div>
  );
}

// Info row component
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value || '—'}</dd>
    </div>
  );
}

export function SalesOpsEntityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: entity, isLoading, error } = useBiddingEntity(id);
  const deleteMutation = useDeleteBiddingEntity();

  const handleDelete = async () => {
    if (!entity) return;

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${entity.name}"? This will hide it from lists but preserve historical data.`
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(entity.id);
      toast.success('Entity deactivated successfully');
      navigate('/salesops/entities');
    } catch {
      toast.error('Failed to deactivate entity');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Failed to load bidding entity. Please try again.
      </div>
    );
  }

  // Calculate SBA status
  const sbaStatus = (() => {
    if (!entity.is8a) return { status: 'not8a', label: 'Not in 8(a) Program', color: 'gray' };
    if (!entity.sbaExpirationDate)
      return { status: 'active', label: '8(a) Active', color: 'green' };

    const daysUntil = entity.daysUntilSbaExpiration;
    if (daysUntil !== undefined && daysUntil !== null) {
      if (daysUntil < 0)
        return { status: 'expired', label: '8(a) Expired', color: 'red' };
      if (daysUntil <= 30)
        return { status: 'critical', label: `Expires in ${daysUntil} days`, color: 'red' };
      if (daysUntil <= 90)
        return { status: 'warning', label: `Expires in ${daysUntil} days`, color: 'amber' };
    }
    return { status: 'active', label: '8(a) Active', color: 'green' };
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/salesops/entities"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Entities
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{entity.name}</h1>
              {entity.legalName && entity.legalName !== entity.name && (
                <p className="text-sm text-gray-500">{entity.legalName}</p>
              )}
            </div>
            {!entity.isActive && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                Inactive
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/salesops/entities/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Link>
          {entity.isActive && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deactivate
            </button>
          )}
        </div>
      </div>

      {/* SBA Status Alert */}
      {entity.is8a && sbaStatus.status !== 'active' && (
        <div
          className={`rounded-lg p-4 ${
            sbaStatus.color === 'red'
              ? 'bg-red-50 border border-red-200'
              : sbaStatus.color === 'amber'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 mt-0.5 ${
                sbaStatus.color === 'red'
                  ? 'text-red-600'
                  : sbaStatus.color === 'amber'
                  ? 'text-amber-600'
                  : 'text-gray-600'
              }`}
            />
            <div>
              <h3
                className={`text-sm font-medium ${
                  sbaStatus.color === 'red'
                    ? 'text-red-800'
                    : sbaStatus.color === 'amber'
                    ? 'text-amber-800'
                    : 'text-gray-800'
                }`}
              >
                {sbaStatus.label}
              </h3>
              {entity.sbaExpirationDate && (
                <p
                  className={`mt-1 text-sm ${
                    sbaStatus.color === 'red'
                      ? 'text-red-700'
                      : sbaStatus.color === 'amber'
                      ? 'text-amber-700'
                      : 'text-gray-700'
                  }`}
                >
                  Expiration Date: {format(new Date(entity.sbaExpirationDate), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* 8(a) Program Status */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">8(a) Program Status</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                {sbaStatus.status === 'not8a' ? (
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                    <XCircle className="h-4 w-4" />
                    Not in 8(a) Program
                  </span>
                ) : sbaStatus.color === 'green' ? (
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    {sbaStatus.label}
                  </span>
                ) : sbaStatus.color === 'amber' ? (
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    <Clock className="h-4 w-4" />
                    {sbaStatus.label}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <XCircle className="h-4 w-4" />
                    {sbaStatus.label}
                  </span>
                )}
              </div>

              {entity.is8a && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar className="h-4 w-4" />
                      Entry Date
                    </div>
                    <p className="font-medium text-gray-900">
                      {entity.sbaEntryDate
                        ? format(new Date(entity.sbaEntryDate), 'MMM d, yyyy')
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar className="h-4 w-4" />
                      Expiration Date
                    </div>
                    <p className="font-medium text-gray-900">
                      {entity.sbaExpirationDate
                        ? format(new Date(entity.sbaExpirationDate), 'MMM d, yyyy')
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar className="h-4 w-4" />
                      Graduation Date
                    </div>
                    <p className="font-medium text-gray-900">
                      {entity.sbaGraduationDate
                        ? format(new Date(entity.sbaGraduationDate), 'MMM d, yyyy')
                        : '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Certifications</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CertBadge
                  label="SB"
                  fullName="Small Business"
                  active={entity.isSmallBusiness}
                />
                <CertBadge
                  label="8(a)"
                  fullName="8(a) Program"
                  active={entity.is8a}
                />
                <CertBadge
                  label="SDVOSB"
                  fullName="Service-Disabled Veteran-Owned"
                  active={entity.isSDVOSB}
                />
                <CertBadge
                  label="VOSB"
                  fullName="Veteran-Owned"
                  active={entity.isVOSB}
                />
                <CertBadge
                  label="WOSB"
                  fullName="Women-Owned"
                  active={entity.isWOSB}
                />
                <CertBadge
                  label="EDWOSB"
                  fullName="Economically Disadvantaged WOSB"
                  active={entity.isEDWOSB}
                />
                <CertBadge
                  label="HUBZone"
                  fullName="Historically Underutilized Business Zone"
                  active={entity.isHUBZone}
                />
                <CertBadge
                  label="SDB"
                  fullName="Small Disadvantaged Business"
                  active={entity.isSDB}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          {entity.notes && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{entity.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Business Identifiers */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Business Identifiers</h2>
              </div>
            </div>
            <div className="p-5">
              <dl>
                <InfoRow label="CAGE Code" value={entity.cageCode} />
                <InfoRow label="UEI Number" value={entity.ueiNumber} />
                <InfoRow label="DUNS Number" value={entity.dunsNumber} />
                <InfoRow label="Tax ID" value={entity.taxId} />
              </dl>
            </div>
          </div>

          {/* Address */}
          {(entity.address || entity.city || entity.state) && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Address</h2>
                </div>
              </div>
              <div className="p-5">
                <address className="text-sm text-gray-700 not-italic">
                  {entity.address && <p>{entity.address}</p>}
                  {(entity.city || entity.state || entity.postalCode) && (
                    <p>
                      {entity.city}
                      {entity.city && entity.state && ', '}
                      {entity.state} {entity.postalCode}
                    </p>
                  )}
                  {entity.country && <p>{entity.country}</p>}
                </address>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Opportunities</h2>
            </div>
            <div className="p-5 text-center">
              <Link
                to={`/salesops/opportunities?biddingEntityId=${entity.id}`}
                className="inline-block text-sm text-orange-600 hover:text-orange-700"
              >
                View Associated Opportunities
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesOpsEntityDetailPage;
