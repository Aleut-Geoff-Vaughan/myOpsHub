import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useContractVehicle, useDeleteContractVehicle, useOpportunities } from '../../hooks/useSalesOps';
import toast from 'react-hot-toast';

// Format date
function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format currency
function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Check if expiring soon (within 90 days)
function isExpiringSoon(dateString: string | undefined | null): boolean {
  if (!dateString) return false;
  const expirationDate = new Date(dateString);
  const today = new Date();
  const daysUntilExpiration = (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiration > 0 && daysUntilExpiration <= 90;
}

// Check if expired
function isExpired(dateString: string | undefined | null): boolean {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

// Days until expiration
function daysUntilExpiration(dateString: string | undefined | null): number | null {
  if (!dateString) return null;
  const expirationDate = new Date(dateString);
  const today = new Date();
  return Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Collapsible section component
function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

// Field display component
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value || '-'}</div>
    </div>
  );
}

export function SalesOpsVehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch contract vehicle
  const { data: vehicle, isLoading, error } = useContractVehicle(id);

  // Fetch opportunities using this vehicle
  const { data: opportunitiesData } = useOpportunities({});

  // Filter opportunities that use this vehicle
  const vehicleOpportunities = opportunitiesData?.items?.filter(
    (opp) => opp.id && vehicle?.id // This would need contractVehicleId filter on backend
  ) || [];

  // Delete mutation
  const deleteVehicle = useDeleteContractVehicle();

  const handleDelete = async () => {
    if (!vehicle) return;
    if (!confirm(`Are you sure you want to delete contract vehicle "${vehicle.name}"?`)) {
      return;
    }
    try {
      await deleteVehicle.mutateAsync(vehicle.id);
      toast.success('Contract vehicle deleted');
      navigate('/salesops/vehicles');
    } catch {
      toast.error('Failed to delete contract vehicle');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load contract vehicle: {error instanceof Error ? error.message : 'Vehicle not found'}
        </div>
        <Link
          to="/salesops/vehicles"
          className="mt-4 inline-flex items-center text-sm text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Contract Vehicles
        </Link>
      </div>
    );
  }

  const daysRemaining = daysUntilExpiration(vehicle.expirationDate);
  const expired = isExpired(vehicle.expirationDate);
  const expiringSoon = isExpiringSoon(vehicle.expirationDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/salesops/vehicles"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Contract Vehicles
          </Link>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.name}
                {!vehicle.isActive && (
                  <span className="ml-2 px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded">
                    Inactive
                  </span>
                )}
              </h1>
              {vehicle.contractNumber && (
                <p className="text-gray-600">{vehicle.contractNumber}</p>
              )}
              {vehicle.vehicleType && (
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {vehicle.vehicleType}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/salesops/vehicles/${vehicle.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Expiration Warning Banner */}
      {(expired || expiringSoon) && (
        <div
          className={`rounded-lg p-4 flex items-start space-x-3 ${
            expired ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <AlertTriangle
            className={`h-5 w-5 ${expired ? 'text-red-500' : 'text-yellow-500'}`}
          />
          <div>
            <h3
              className={`font-medium ${expired ? 'text-red-800' : 'text-yellow-800'}`}
            >
              {expired ? 'Contract Vehicle Expired' : 'Expiration Warning'}
            </h3>
            <p className={`text-sm ${expired ? 'text-red-700' : 'text-yellow-700'}`}>
              {expired
                ? `This contract vehicle expired on ${formatDate(vehicle.expirationDate)}.`
                : `This contract vehicle will expire in ${daysRemaining} days (${formatDate(vehicle.expirationDate)}).`}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Ceiling Value</div>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(vehicle.ceilingValue)}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Awarded Value</div>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(vehicle.awardedValue)}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Remaining</div>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {formatCurrency(vehicle.remainingValue)}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Days Remaining</div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div
            className={`mt-2 text-2xl font-bold ${
              expired
                ? 'text-red-600'
                : expiringSoon
                ? 'text-yellow-600'
                : 'text-gray-900'
            }`}
          >
            {daysRemaining !== null ? (daysRemaining < 0 ? 'Expired' : daysRemaining) : '-'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Details Section */}
          <Section title="Contract Details" icon={FileText} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4">
              <Field label="Contract Number" value={vehicle.contractNumber} />
              <Field label="Vehicle Type" value={vehicle.vehicleType} />
              <Field label="Issuing Agency" value={vehicle.issuingAgency} />
              <Field
                label="Bidding Entity"
                value={
                  vehicle.biddingEntity ? (
                    <Link
                      to={`/salesops/entities/${vehicle.biddingEntityId}`}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {vehicle.biddingEntity.name}
                    </Link>
                  ) : (
                    '-'
                  )
                }
              />
              <Field
                label="Status"
                value={
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      vehicle.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {vehicle.isActive ? 'Active' : 'Inactive'}
                  </span>
                }
              />
            </div>
          </Section>

          {/* Key Dates Section */}
          <Section title="Key Dates" icon={Calendar} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4">
              <Field label="Award Date" value={formatDate(vehicle.awardDate)} />
              <Field label="Start Date" value={formatDate(vehicle.startDate)} />
              <Field label="End Date" value={formatDate(vehicle.endDate)} />
              <Field
                label="Expiration Date"
                value={
                  <span
                    className={
                      expired
                        ? 'text-red-600 font-medium'
                        : expiringSoon
                        ? 'text-yellow-600 font-medium'
                        : ''
                    }
                  >
                    {formatDate(vehicle.expirationDate)}
                    {expired && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                        Expired
                      </span>
                    )}
                    {expiringSoon && !expired && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                        Soon
                      </span>
                    )}
                  </span>
                }
              />
            </div>
          </Section>

          {/* Financial Section */}
          <Section title="Financial" icon={DollarSign} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4">
              <Field label="Ceiling Value" value={formatCurrency(vehicle.ceilingValue)} />
              <Field label="Awarded Value" value={formatCurrency(vehicle.awardedValue)} />
              <Field label="Remaining Value" value={formatCurrency(vehicle.remainingValue)} />
            </div>
          </Section>

          {/* Eligibility Notes Section */}
          {vehicle.eligibilityNotes && (
            <Section title="Eligibility Notes" icon={FileText} defaultOpen={false}>
              <div className="pt-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {vehicle.eligibilityNotes}
                </p>
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bidding Entity Card */}
          {vehicle.biddingEntity && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Bidding Entity</h3>
              <Link
                to={`/salesops/entities/${vehicle.biddingEntityId}`}
                className="flex items-center text-sm text-gray-700 hover:text-orange-600"
              >
                <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                {vehicle.biddingEntity.name}
              </Link>
            </div>
          )}

          {/* Audit Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">System Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span>Created: {formatDate(vehicle.createdAt)}</span>
              </div>
              {vehicle.updatedAt && (
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Updated: {formatDate(vehicle.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Related Opportunities Placeholder */}
          {vehicleOpportunities.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Related Opportunities</h3>
              <div className="space-y-2">
                {vehicleOpportunities.slice(0, 5).map((opp) => (
                  <Link
                    key={opp.id}
                    to={`/salesops/opportunities/${opp.id}`}
                    className="block p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="text-sm font-medium text-gray-900">{opp.name}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-between mt-1">
                      <span>{opp.stageName}</span>
                      <span>{formatCurrency(opp.amount)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SalesOpsVehicleDetailPage;
