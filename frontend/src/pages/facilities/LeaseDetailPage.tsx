import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { facilitiesPortalService, LeaseStatus, OptionYearStatus } from '../../services/facilitiesPortalService';
import type { LeaseOptionYear } from '../../services/facilitiesPortalService';
import { format, parseISO, differenceInDays } from 'date-fns';

function getStatusLabel(status: LeaseStatus): string {
  switch (status) {
    case LeaseStatus.Draft: return 'Draft';
    case LeaseStatus.Active: return 'Active';
    case LeaseStatus.Expired: return 'Expired';
    case LeaseStatus.Terminated: return 'Terminated';
    case LeaseStatus.Pending: return 'Pending';
    default: return 'Unknown';
  }
}

function getStatusColor(status: LeaseStatus): string {
  switch (status) {
    case LeaseStatus.Active: return 'bg-teal-100 text-teal-800';
    case LeaseStatus.Pending: return 'bg-yellow-100 text-yellow-800';
    case LeaseStatus.Draft: return 'bg-gray-100 text-gray-800';
    case LeaseStatus.Expired: return 'bg-red-100 text-red-800';
    case LeaseStatus.Terminated: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getOptionYearStatusLabel(status: OptionYearStatus): string {
  switch (status) {
    case OptionYearStatus.NotExercised: return 'Not Exercised';
    case OptionYearStatus.Exercised: return 'Exercised';
    case OptionYearStatus.Declined: return 'Declined';
    case OptionYearStatus.Expired: return 'Expired';
    default: return 'Unknown';
  }
}

function getOptionYearStatusColor(status: OptionYearStatus): string {
  switch (status) {
    case OptionYearStatus.NotExercised: return 'bg-yellow-100 text-yellow-800';
    case OptionYearStatus.Exercised: return 'bg-teal-100 text-teal-800';
    case OptionYearStatus.Declined: return 'bg-gray-100 text-gray-800';
    case OptionYearStatus.Expired: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyPrecise(amount?: number): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

type TabType = 'overview' | 'financial' | 'option-years' | 'documents';

export function LeaseDetailPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: lease, isLoading: loadingLease } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => facilitiesPortalService.getLease(leaseId!),
    enabled: !!leaseId,
  });

  const { data: optionYears = [], isLoading: loadingOptionYears } = useQuery({
    queryKey: ['lease-option-years', leaseId],
    queryFn: () => facilitiesPortalService.getLeaseOptionYears(leaseId!),
    enabled: !!leaseId,
  });

  const exerciseMutation = useMutation({
    mutationFn: ({ optionYearId, notes }: { optionYearId: string; notes?: string }) =>
      facilitiesPortalService.exerciseOptionYear(leaseId!, optionYearId, notes),
    onSuccess: () => {
      toast.success('Option year exercised successfully');
      queryClient.invalidateQueries({ queryKey: ['lease-option-years', leaseId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to exercise option year');
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ optionYearId, notes }: { optionYearId: string; notes?: string }) =>
      facilitiesPortalService.declineOptionYear(leaseId!, optionYearId, notes),
    onSuccess: () => {
      toast.success('Option year declined');
      queryClient.invalidateQueries({ queryKey: ['lease-option-years', leaseId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to decline option year');
    },
  });

  const handleExercise = (optionYear: LeaseOptionYear) => {
    if (window.confirm(`Are you sure you want to exercise Option Year ${optionYear.optionYearNumber}?`)) {
      exerciseMutation.mutate({ optionYearId: optionYear.id });
    }
  };

  const handleDecline = (optionYear: LeaseOptionYear) => {
    if (window.confirm(`Are you sure you want to decline Option Year ${optionYear.optionYearNumber}?`)) {
      declineMutation.mutate({ optionYearId: optionYear.id });
    }
  };

  if (loadingLease || loadingOptionYears) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Lease not found</h2>
        <Link to="/facilities/leases" className="text-teal-600 hover:text-teal-700 mt-2 inline-block">
          Back to Leases
        </Link>
      </div>
    );
  }

  const daysUntilExpiration = lease.endDate ? differenceInDays(parseISO(lease.endDate), new Date()) : null;
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration >= 0 && daysUntilExpiration <= 90;

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'financial' as const, label: 'Financial' },
    { id: 'option-years' as const, label: `Option Years (${optionYears.length})` },
    { id: 'documents' as const, label: 'Documents' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/facilities/leases" className="hover:text-teal-600">Leases</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900">{lease.leaseName}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{lease.leaseName}</h1>
          {lease.leaseNumber && (
            <p className="text-gray-600">Lease #{lease.leaseNumber}</p>
          )}
        </div>
        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(lease.status)}`}>
          {getStatusLabel(lease.status)}
        </span>
      </div>

      {/* Expiration Alert */}
      {isExpiringSoon && lease.status === LeaseStatus.Active && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-red-900">Lease Expiring Soon</p>
            <p className="text-sm text-red-700">
              This lease expires in {daysUntilExpiration} days{lease.endDate && ` on ${format(parseISO(lease.endDate), 'MMMM d, yyyy')}`}.
              {optionYears.some(oy => oy.status === OptionYearStatus.NotExercised) &&
                ' Consider exercising an option year to extend.'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lease Details</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Office</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.office?.name || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Start Date</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.startDate ? format(parseISO(lease.startDate), 'MMM d, yyyy') : '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">End Date</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.endDate ? format(parseISO(lease.endDate), 'MMM d, yyyy') : '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Base Term</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.baseTermMonths} months</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Square Footage</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.squareFootage?.toLocaleString() || '-'} sq ft</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Usable Square Footage</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.usableSquareFootage?.toLocaleString() || '-'} sq ft</dd>
              </div>
            </dl>
          </div>

          {/* Landlord Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Landlord Information</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Landlord Name</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.landlordName || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Contact</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.landlordContact || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Property Manager</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.propertyManager || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Notes */}
          {(lease.notes || lease.specialClauses || lease.terminationClause || lease.renewalTerms) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Notes</h2>
              <div className="space-y-4">
                {lease.specialClauses && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Special Clauses</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{lease.specialClauses}</p>
                  </div>
                )}
                {lease.terminationClause && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Termination Clause</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{lease.terminationClause}</p>
                  </div>
                )}
                {lease.renewalTerms && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Renewal Terms</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{lease.renewalTerms}</p>
                  </div>
                )}
                {lease.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{lease.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rent</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Monthly Rent</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(lease.monthlyRent)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Annual Rent</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(lease.annualRent)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Rent per Sq Ft</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrencyPrecise(lease.rentPerSqFt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Security Deposit</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(lease.securityDeposit)}</dd>
              </div>
            </dl>
          </div>

          {/* Additional Costs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Costs</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Base Year Expenses</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(lease.baseYearExpenses)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">CAM Charges</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(lease.camCharges)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Parking Spaces</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.parkingSpaces || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Parking Cost</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(lease.parkingCost)}/month</dd>
              </div>
            </dl>
          </div>

          {/* Escalation & Insurance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Escalation</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Escalation Type</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.escalationType || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Escalation Percent</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {lease.escalationPercent !== undefined ? `${lease.escalationPercent}%` : '-'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Insurance</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Insurance Required</dt>
                <dd className="text-sm font-medium text-gray-900">{lease.insuranceRequired ? 'Yes' : 'No'}</dd>
              </div>
              {lease.insuranceRequired && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Minimum Coverage</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatCurrency(lease.insuranceMinCoverage)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Option Years Tab */}
      {activeTab === 'option-years' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {optionYears.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">No Option Years</p>
              <p className="text-sm">This lease has no option years configured.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Option Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise Deadline</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {optionYears.map((oy) => {
                  const deadlineDays = oy.exerciseDeadline ? differenceInDays(parseISO(oy.exerciseDeadline), new Date()) : null;
                  const isDeadlineSoon = oy.status === OptionYearStatus.NotExercised && deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 30;
                  return (
                    <tr key={oy.id} className={isDeadlineSoon ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        Year {oy.optionYearNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {oy.startDate ? format(parseISO(oy.startDate), 'MMM d, yyyy') : '-'} - {oy.endDate ? format(parseISO(oy.endDate), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{oy.exerciseDeadline ? format(parseISO(oy.exerciseDeadline), 'MMM d, yyyy') : '-'}</p>
                          {oy.status === OptionYearStatus.NotExercised && deadlineDays !== null && (
                            <p className={`text-xs ${deadlineDays < 0 ? 'text-red-600' : isDeadlineSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                              {deadlineDays < 0 ? 'Deadline passed' : `${deadlineDays} days remaining`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(oy.monthlyRent)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getOptionYearStatusColor(oy.status)}`}>
                          {getOptionYearStatusLabel(oy.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {oy.status === OptionYearStatus.NotExercised && deadlineDays >= 0 && (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleExercise(oy)}
                              disabled={exerciseMutation.isPending}
                              className="px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 transition disabled:opacity-50"
                            >
                              Exercise
                            </button>
                            <button
                              onClick={() => handleDecline(oy)}
                              disabled={declineMutation.isPending}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">Document Management</p>
          <p className="text-sm">Document upload and management coming soon.</p>
        </div>
      )}
    </div>
  );
}
