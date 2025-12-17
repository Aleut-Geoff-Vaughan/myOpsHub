import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Building2,
  Phone,
  MapPin,
  ExternalLink,
  Clock,
  FileText,
} from 'lucide-react';
import { useAccount, useDeleteAccount, useOpportunities } from '../../hooks/useSalesOps';
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

function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Section component
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

// Field component
function Field({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value || '-'}</div>
    </div>
  );
}

export function SalesOpsAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: account, isLoading, error } = useAccount(id);
  const deleteMutation = useDeleteAccount();

  // Fetch opportunities for this account
  const { data: opportunitiesData } = useOpportunities({ accountId: id, take: 100 });
  const opportunities = opportunitiesData?.items || [];

  const handleDelete = async () => {
    if (!account) return;
    if (!confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(account.id);
      toast.success('Account deleted successfully');
      navigate('/salesops/accounts');
    } catch {
      toast.error('Failed to delete account. It may have associated opportunities.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading account...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="space-y-4">
        <Link to="/salesops/accounts" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Accounts
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Account not found or error loading data.</p>
        </div>
      </div>
    );
  }

  // Calculate opportunity stats
  const openOpportunities = opportunities.filter((o) => !o.result);
  const totalValue = openOpportunities.reduce((sum, o) => sum + o.amount, 0);
  const weightedValue = openOpportunities.reduce((sum, o) => sum + o.weightedAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/salesops/accounts"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Accounts
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
              {account.acronym && (
                <span className="text-sm text-gray-500">({account.acronym})</span>
              )}
            </div>
            {!account.isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                Inactive
              </span>
            )}
          </div>
          {account.accountType && (
            <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {account.accountType}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/salesops/accounts/${account.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Open Opportunities</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{openOpportunities.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Pipeline Value</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Weighted Value</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(weightedValue)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Opportunities</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{opportunities.length}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Details */}
          <Section title="Account Details" icon={<Building2 className="h-5 w-5 text-orange-600" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              <Field label="Account Name" value={account.name} />
              <Field label="Acronym" value={account.acronym} />
              <Field label="Account Type" value={account.accountType} />
              <Field label="Federal Department" value={account.federalDepartment} />
              <Field label="Portfolio" value={account.portfolio} />
              <Field label="Status" value={account.isActive ? 'Active' : 'Inactive'} />
              <Field
                label="Description"
                value={account.description}
                className="col-span-2 md:col-span-3"
              />
            </div>
          </Section>

          {/* Contact Information */}
          <Section title="Contact Information" icon={<Phone className="h-5 w-5 text-blue-600" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              <Field
                label="Phone"
                value={
                  account.phone ? (
                    <a href={`tel:${account.phone}`} className="text-orange-600 hover:text-orange-700">
                      {account.phone}
                    </a>
                  ) : null
                }
              />
              <Field
                label="Website"
                value={
                  account.website ? (
                    <a
                      href={account.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      Visit Website <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null
                }
              />
            </div>
          </Section>

          {/* Address */}
          <Section title="Address" icon={<MapPin className="h-5 w-5 text-purple-600" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              <Field label="Street Address" value={account.address} className="col-span-2 md:col-span-3" />
              <Field label="City" value={account.city} />
              <Field label="State" value={account.state} />
              <Field label="Postal Code" value={account.postalCode} />
              <Field label="Country" value={account.country} />
            </div>
          </Section>

          {/* Notes */}
          {account.notes && (
            <Section title="Notes" icon={<FileText className="h-5 w-5 text-gray-600" />}>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{account.notes}</p>
            </Section>
          )}

          {/* Related Opportunities */}
          <Section title={`Opportunities (${opportunities.length})`} icon={<FileText className="h-5 w-5 text-emerald-600" />}>
            {opportunities.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No opportunities for this account.</p>
                <Link
                  to={`/salesops/opportunities/new?accountId=${account.id}`}
                  className="mt-2 inline-flex items-center text-orange-600 hover:text-orange-700"
                >
                  Create Opportunity
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {opportunities.slice(0, 10).map((opp) => (
                  <Link
                    key={opp.id}
                    to={`/salesops/opportunities/${opp.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{opp.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {opp.stageName} • {formatDate(opp.closeDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{formatCurrency(opp.amount)}</div>
                        <div className="text-xs text-gray-500">{opp.probabilityPercent}%</div>
                      </div>
                    </div>
                  </Link>
                ))}
                {opportunities.length > 10 && (
                  <Link
                    to={`/salesops/opportunities?accountId=${account.id}`}
                    className="block text-center text-sm text-orange-600 hover:text-orange-700 py-2"
                  >
                    View all {opportunities.length} opportunities
                  </Link>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Parent Account */}
          {account.parentAccount && (
            <Section title="Parent Account" icon={<Building2 className="h-5 w-5 text-gray-600" />}>
              <Link
                to={`/salesops/accounts/${account.parentAccount.id}`}
                className="block p-3 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
              >
                <div className="font-medium text-orange-600 hover:text-orange-700">
                  {account.parentAccount.name}
                </div>
                {account.parentAccount.acronym && (
                  <div className="text-xs text-gray-500">({account.parentAccount.acronym})</div>
                )}
              </Link>
            </Section>
          )}

          {/* Quick Actions */}
          <Section title="Quick Actions" icon={<FileText className="h-5 w-5 text-gray-600" />}>
            <div className="space-y-2">
              <Link
                to={`/salesops/opportunities/new?accountId=${account.id}`}
                className="block w-full px-4 py-2 text-center text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                New Opportunity
              </Link>
              <Link
                to={`/salesops/contacts/new?accountId=${account.id}`}
                className="block w-full px-4 py-2 text-center text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Add Contact
              </Link>
            </div>
          </Section>

          {/* System Information */}
          <Section title="System Information" icon={<Clock className="h-5 w-5 text-gray-400" />} defaultOpen={false}>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500">Created</div>
                <div className="text-gray-900">{formatDateTime(account.createdAt)}</div>
              </div>
              {account.updatedAt && (
                <div>
                  <div className="text-gray-500">Last Modified</div>
                  <div className="text-gray-900">{formatDateTime(account.updatedAt)}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500">Account ID</div>
                <div className="text-gray-900 font-mono text-xs">{account.id}</div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

export default SalesOpsAccountDetailPage;
