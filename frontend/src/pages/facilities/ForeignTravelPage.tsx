import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { facilitiesPortalService, ForeignTravelStatus, TravelPurpose } from '../../services/facilitiesPortalService';
import type { ForeignTravelRecord } from '../../services/facilitiesPortalService';
import { useAuthStore, AppRole } from '../../stores/authStore';
import { format, parseISO } from 'date-fns';

function getStatusLabel(status: ForeignTravelStatus): string {
  switch (status) {
    case ForeignTravelStatus.Draft: return 'Draft';
    case ForeignTravelStatus.Submitted: return 'Submitted';
    case ForeignTravelStatus.Approved: return 'Approved';
    case ForeignTravelStatus.Denied: return 'Denied';
    case ForeignTravelStatus.Completed: return 'Completed';
    case ForeignTravelStatus.Cancelled: return 'Cancelled';
    default: return 'Unknown';
  }
}

function getStatusColor(status: ForeignTravelStatus): string {
  switch (status) {
    case ForeignTravelStatus.Draft: return 'bg-gray-100 text-gray-800';
    case ForeignTravelStatus.Submitted: return 'bg-yellow-100 text-yellow-800';
    case ForeignTravelStatus.Approved: return 'bg-teal-100 text-teal-800';
    case ForeignTravelStatus.Denied: return 'bg-red-100 text-red-800';
    case ForeignTravelStatus.Completed: return 'bg-blue-100 text-blue-800';
    case ForeignTravelStatus.Cancelled: return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPurposeLabel(purpose: TravelPurpose): string {
  switch (purpose) {
    case TravelPurpose.Business: return 'Business';
    case TravelPurpose.Personal: return 'Personal';
    case TravelPurpose.Mixed: return 'Mixed';
    default: return 'Unknown';
  }
}

export function ForeignTravelPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuthStore();
  const canManage = hasRole(AppRole.OfficeManager) || hasRole(AppRole.TenantAdmin) || hasRole(AppRole.SysAdmin);

  const [statusFilter, setStatusFilter] = useState<ForeignTravelStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ForeignTravelRecord | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['foreign-travel', statusFilter, upcomingOnly],
    queryFn: () => facilitiesPortalService.getForeignTravelRecords({
      status: statusFilter === 'all' ? undefined : statusFilter,
      upcomingOnly,
    }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => facilitiesPortalService.approveForeignTravelRecord(id),
    onSuccess: () => {
      toast.success('Travel request approved');
      queryClient.invalidateQueries({ queryKey: ['foreign-travel'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve');
    },
  });

  const denyMutation = useMutation({
    mutationFn: (id: string) => facilitiesPortalService.denyForeignTravelRecord(id),
    onSuccess: () => {
      toast.success('Travel request denied');
      queryClient.invalidateQueries({ queryKey: ['foreign-travel'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deny');
    },
  });

  const briefMutation = useMutation({
    mutationFn: (id: string) => facilitiesPortalService.briefForeignTravelRecord(id),
    onSuccess: () => {
      toast.success('Employee briefed');
      queryClient.invalidateQueries({ queryKey: ['foreign-travel'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record briefing');
    },
  });

  // Filter records by search
  const filteredRecords = records.filter(record => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.employee?.displayName?.toLowerCase().includes(query) ||
      record.employee?.email?.toLowerCase().includes(query) ||
      record.countries?.toLowerCase().includes(query)
    );
  });

  // Summary stats
  const pendingApproval = records.filter(r => r.status === ForeignTravelStatus.Submitted).length;
  const approvedUpcoming = records.filter(r => r.status === ForeignTravelStatus.Approved).length;
  const needsBriefing = records.filter(r => r.status === ForeignTravelStatus.Approved && !r.briefingDate).length;
  const needsDebrief = records.filter(r => r.status === ForeignTravelStatus.Approved && r.briefingDate && !r.debriefDate).length;

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
        <h1 className="text-2xl font-bold text-gray-900">Foreign Travel</h1>
        <p className="text-gray-600 mt-1">Manage foreign travel requests and briefings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendingApproval > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <svg className={`w-5 h-5 ${pendingApproval > 0 ? 'text-yellow-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className={`text-2xl font-bold ${pendingApproval > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{pendingApproval}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved/Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{approvedUpcoming}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${needsBriefing > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <svg className={`w-5 h-5 ${needsBriefing > 0 ? 'text-orange-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Needs Briefing</p>
              <p className={`text-2xl font-bold ${needsBriefing > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{needsBriefing}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${needsDebrief > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <svg className={`w-5 h-5 ${needsDebrief > 0 ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Needs Debrief</p>
              <p className={`text-2xl font-bold ${needsDebrief > 0 ? 'text-blue-600' : 'text-gray-900'}`}>{needsDebrief}</p>
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
                placeholder="Search by name or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as ForeignTravelStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value={ForeignTravelStatus.Draft}>Draft</option>
            <option value={ForeignTravelStatus.Submitted}>Submitted</option>
            <option value={ForeignTravelStatus.Approved}>Approved</option>
            <option value={ForeignTravelStatus.Denied}>Denied</option>
            <option value={ForeignTravelStatus.Completed}>Completed</option>
            <option value={ForeignTravelStatus.Cancelled}>Cancelled</option>
          </select>

          {/* Upcoming Only */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={upcomingOnly}
              onChange={(e) => setUpcomingOnly(e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            Upcoming Only
          </label>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Countries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travel Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Briefing</th>
                <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium">No travel records found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{record.employee?.displayName || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{record.employee?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{record.countries}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <p>{format(parseISO(record.departureDate), 'MMM d, yyyy')}</p>
                      <p className="text-gray-500">to {format(parseISO(record.returnDate), 'MMM d, yyyy')}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {getPurposeLabel(record.purpose)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {record.briefingDate ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                            Briefed
                          </span>
                        ) : record.status === ForeignTravelStatus.Approved ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            Pending
                          </span>
                        ) : null}
                        {record.debriefDate ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Debriefed
                          </span>
                        ) : record.briefingDate && record.status === ForeignTravelStatus.Approved ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Needs Debrief
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="text-teal-600 hover:text-teal-700"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {canManage && record.status === ForeignTravelStatus.Submitted && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(record.id)}
                              disabled={approveMutation.isPending}
                              className="text-teal-600 hover:text-teal-700"
                              title="Approve"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => denyMutation.mutate(record.id)}
                              disabled={denyMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                              title="Deny"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                        {canManage && record.status === ForeignTravelStatus.Approved && !record.briefingDate && (
                          <button
                            onClick={() => briefMutation.mutate(record.id)}
                            disabled={briefMutation.isPending}
                            className="text-orange-600 hover:text-orange-700"
                            title="Record Briefing"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Foreign Travel Details</h2>
              <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Employee</h3>
                <p className="font-medium text-gray-900">{selectedRecord.employee?.displayName}</p>
                <p className="text-sm text-gray-600">{selectedRecord.employee?.email}</p>
              </div>

              {/* Travel Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Destination Countries</h3>
                  <p className="font-medium text-gray-900">{selectedRecord.countries}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Purpose</h3>
                  <p className="text-gray-900">{getPurposeLabel(selectedRecord.purpose)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Departure Date</h3>
                  <p className="text-gray-900">{format(parseISO(selectedRecord.departureDate), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Return Date</h3>
                  <p className="text-gray-900">{format(parseISO(selectedRecord.returnDate), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRecord.status)}`}>
                    {getStatusLabel(selectedRecord.status)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted Date</h3>
                  <p className="text-gray-900">
                    {selectedRecord.submittedDate ? format(parseISO(selectedRecord.submittedDate), 'MMMM d, yyyy') : '-'}
                  </p>
                </div>
              </div>

              {/* Justification */}
              {selectedRecord.justification && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Justification</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.justification}</p>
                </div>
              )}

              {/* Itinerary */}
              {selectedRecord.itineraryDetails && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Itinerary Details</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.itineraryDetails}</p>
                </div>
              )}

              {/* Briefing Info */}
              {selectedRecord.briefingDate && (
                <div className="bg-teal-50 rounded-lg p-4">
                  <h3 className="font-medium text-teal-900 mb-3">Pre-Travel Briefing</h3>
                  <p className="text-sm text-teal-700">
                    Briefed on {format(parseISO(selectedRecord.briefingDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}

              {/* Debrief Info */}
              {selectedRecord.debriefDate && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3">Post-Travel Debrief</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    Debriefed on {format(parseISO(selectedRecord.debriefDate), 'MMMM d, yyyy')}
                  </p>
                  {selectedRecord.debriefNotes && (
                    <p className="text-blue-800 whitespace-pre-wrap">{selectedRecord.debriefNotes}</p>
                  )}
                </div>
              )}

              {/* Foreign Contacts */}
              {selectedRecord.foreignContacts && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">Foreign Contacts Reported</h3>
                  <p className="text-yellow-800 whitespace-pre-wrap">{selectedRecord.foreignContacts}</p>
                </div>
              )}

              {/* FSO Notes */}
              {selectedRecord.fsoNotes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">FSO Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.fsoNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
