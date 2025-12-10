import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facilitiesPortalService, SecurityClearanceLevel, ClearanceStatus } from '../../services/facilitiesPortalService';
import type { EmployeeClearance } from '../../services/facilitiesPortalService';
import { format, parseISO, differenceInDays } from 'date-fns';

function getClearanceLabel(level: SecurityClearanceLevel): string {
  switch (level) {
    case SecurityClearanceLevel.None: return 'None';
    case SecurityClearanceLevel.PublicTrust: return 'Public Trust';
    case SecurityClearanceLevel.Secret: return 'Secret';
    case SecurityClearanceLevel.TopSecret: return 'Top Secret';
    case SecurityClearanceLevel.TopSecretSci: return 'TS/SCI';
    default: return 'Unknown';
  }
}

function getClearanceColor(level: SecurityClearanceLevel): string {
  switch (level) {
    case SecurityClearanceLevel.None: return 'bg-gray-100 text-gray-800';
    case SecurityClearanceLevel.PublicTrust: return 'bg-blue-100 text-blue-800';
    case SecurityClearanceLevel.Secret: return 'bg-yellow-100 text-yellow-800';
    case SecurityClearanceLevel.TopSecret: return 'bg-orange-100 text-orange-800';
    case SecurityClearanceLevel.TopSecretSci: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: ClearanceStatus): string {
  switch (status) {
    case ClearanceStatus.None: return 'None';
    case ClearanceStatus.InProgress: return 'In Progress';
    case ClearanceStatus.Active: return 'Active';
    case ClearanceStatus.Suspended: return 'Suspended';
    case ClearanceStatus.Revoked: return 'Revoked';
    case ClearanceStatus.Expired: return 'Expired';
    default: return 'Unknown';
  }
}

function getStatusColor(status: ClearanceStatus): string {
  switch (status) {
    case ClearanceStatus.Active: return 'bg-teal-100 text-teal-800';
    case ClearanceStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
    case ClearanceStatus.Suspended: return 'bg-orange-100 text-orange-800';
    case ClearanceStatus.Revoked: return 'bg-red-100 text-red-800';
    case ClearanceStatus.Expired: return 'bg-red-100 text-red-800';
    case ClearanceStatus.None: return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function ClearancesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<SecurityClearanceLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ClearanceStatus | 'all'>('all');
  const [expiringFilter, setExpiringFilter] = useState<number | null>(null);
  const [selectedClearance, setSelectedClearance] = useState<EmployeeClearance | null>(null);

  const { data: clearances = [], isLoading } = useQuery({
    queryKey: ['clearances', levelFilter, statusFilter, expiringFilter],
    queryFn: () => facilitiesPortalService.getClearances({
      level: levelFilter === 'all' ? undefined : levelFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      expiringWithinDays: expiringFilter || undefined,
    }),
  });

  // Filter clearances by search
  const filteredClearances = clearances.filter(clearance => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      clearance.employee?.displayName?.toLowerCase().includes(query) ||
      clearance.employee?.email?.toLowerCase().includes(query) ||
      clearance.sponsoringAgency?.toLowerCase().includes(query)
    );
  });

  // Summary stats
  const activeCount = clearances.filter(c => c.status === ClearanceStatus.Active).length;
  const inProgressCount = clearances.filter(c => c.status === ClearanceStatus.InProgress).length;
  const expiringIn90Days = clearances.filter(c => {
    if (!c.expirationDate) return false;
    const days = differenceInDays(parseISO(c.expirationDate), new Date());
    return days >= 0 && days <= 90 && c.status === ClearanceStatus.Active;
  }).length;
  const scifAccess = clearances.filter(c => c.scifAccess && c.status === ClearanceStatus.Active).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Clearances</h1>
        <p className="text-gray-600 mt-1">Track and manage employee security clearances</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Clearances</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expiringIn90Days > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <svg className={`w-5 h-5 ${expiringIn90Days > 0 ? 'text-red-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiring (90 days)</p>
              <p className={`text-2xl font-bold ${expiringIn90Days > 0 ? 'text-red-600' : 'text-gray-900'}`}>{expiringIn90Days}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">SCIF Access</p>
              <p className="text-2xl font-bold text-gray-900">{scifAccess}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as SecurityClearanceLevel)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Filter by level"
          >
            <option value="all">All Levels</option>
            <option value={SecurityClearanceLevel.PublicTrust}>Public Trust</option>
            <option value={SecurityClearanceLevel.Secret}>Secret</option>
            <option value={SecurityClearanceLevel.TopSecret}>Top Secret</option>
            <option value={SecurityClearanceLevel.TopSecretSci}>TS/SCI</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as ClearanceStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value={ClearanceStatus.Active}>Active</option>
            <option value={ClearanceStatus.InProgress}>In Progress</option>
            <option value={ClearanceStatus.Suspended}>Suspended</option>
            <option value={ClearanceStatus.Expired}>Expired</option>
            <option value={ClearanceStatus.Revoked}>Revoked</option>
          </select>

          {/* Expiring Filter */}
          <select
            value={expiringFilter || 'all'}
            onChange={(e) => setExpiringFilter(e.target.value === 'all' ? null : Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Filter by expiration"
          >
            <option value="all">All</option>
            <option value={30}>Expiring in 30 days</option>
            <option value={60}>Expiring in 60 days</option>
            <option value={90}>Expiring in 90 days</option>
          </select>
        </div>
      </div>

      {/* Clearances Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clearance Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Granted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access</th>
                <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClearances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="text-lg font-medium">No clearances found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredClearances.map((clearance) => {
                  const isExpiringSoon = clearance.expirationDate
                    ? differenceInDays(parseISO(clearance.expirationDate), new Date()) <= 90 && clearance.status === ClearanceStatus.Active
                    : false;
                  return (
                    <tr key={clearance.id} className={`hover:bg-gray-50 ${isExpiringSoon ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{clearance.employee?.displayName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{clearance.employee?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getClearanceColor(clearance.clearanceLevel)}`}>
                          {getClearanceLabel(clearance.clearanceLevel)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(clearance.status)}`}>
                          {getStatusLabel(clearance.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {clearance.grantedDate ? format(parseISO(clearance.grantedDate), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {clearance.expirationDate ? (
                          <div>
                            <p className="text-sm text-gray-900">{format(parseISO(clearance.expirationDate), 'MMM d, yyyy')}</p>
                            {isExpiringSoon && (
                              <p className="text-xs text-red-600 font-medium">
                                {differenceInDays(parseISO(clearance.expirationDate), new Date())} days left
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {clearance.scifAccess && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            SCIF
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedClearance(clearance)}
                          className="text-teal-600 hover:text-teal-700"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedClearance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedClearance(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Clearance Details</h2>
              <button onClick={() => setSelectedClearance(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Employee</h3>
                <p className="font-medium text-gray-900">{selectedClearance.employee?.displayName}</p>
                <p className="text-sm text-gray-600">{selectedClearance.employee?.email}</p>
              </div>

              {/* Clearance Level & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Clearance Level</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getClearanceColor(selectedClearance.clearanceLevel)}`}>
                    {getClearanceLabel(selectedClearance.clearanceLevel)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedClearance.status)}`}>
                    {getStatusLabel(selectedClearance.status)}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Investigation Date</h3>
                  <p className="text-gray-900">
                    {selectedClearance.investigationDate ? format(parseISO(selectedClearance.investigationDate), 'MMMM d, yyyy') : '-'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Adjudication Date</h3>
                  <p className="text-gray-900">
                    {selectedClearance.adjudicationDate ? format(parseISO(selectedClearance.adjudicationDate), 'MMMM d, yyyy') : '-'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Granted Date</h3>
                  <p className="text-gray-900">
                    {selectedClearance.grantedDate ? format(parseISO(selectedClearance.grantedDate), 'MMMM d, yyyy') : '-'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Expiration Date</h3>
                  <p className="text-gray-900">
                    {selectedClearance.expirationDate ? format(parseISO(selectedClearance.expirationDate), 'MMMM d, yyyy') : '-'}
                  </p>
                </div>
              </div>

              {/* Sponsoring Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Sponsoring Agency</h3>
                  <p className="text-gray-900">{selectedClearance.sponsoringAgency || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Contract Number</h3>
                  <p className="text-gray-900">{selectedClearance.contractNumber || '-'}</p>
                </div>
              </div>

              {/* Polygraph */}
              {(selectedClearance.polygraphDate || selectedClearance.polygraphType) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Polygraph Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="text-gray-900">{selectedClearance.polygraphType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="text-gray-900">
                        {selectedClearance.polygraphDate ? format(parseISO(selectedClearance.polygraphDate), 'MMMM d, yyyy') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SCIF Access */}
              {selectedClearance.scifAccess && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-3">SCIF Access</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-red-700">Briefing Date</p>
                      <p className="text-red-900">
                        {selectedClearance.scifBriefingDate ? format(parseISO(selectedClearance.scifBriefingDate), 'MMMM d, yyyy') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Access Programs */}
              {selectedClearance.specialAccessPrograms && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Special Access Programs</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedClearance.specialAccessPrograms}</p>
                </div>
              )}

              {/* Notes */}
              {selectedClearance.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedClearance.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
