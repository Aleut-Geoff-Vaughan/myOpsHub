import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { facilitiesPortalService, FieldAssignmentStatus, SecurityClearanceLevel } from '../../services/facilitiesPortalService';
import type { FieldAssignment } from '../../services/facilitiesPortalService';
import { useAuthStore, AppRole } from '../../stores/authStore';
import { format, parseISO } from 'date-fns';

function getStatusLabel(status: FieldAssignmentStatus): string {
  switch (status) {
    case FieldAssignmentStatus.Proposed: return 'Proposed';
    case FieldAssignmentStatus.Pending: return 'Pending';
    case FieldAssignmentStatus.Active: return 'Active';
    case FieldAssignmentStatus.OnHold: return 'On Hold';
    case FieldAssignmentStatus.Completed: return 'Completed';
    case FieldAssignmentStatus.Cancelled: return 'Cancelled';
    default: return 'Unknown';
  }
}

function getStatusColor(status: FieldAssignmentStatus): string {
  switch (status) {
    case FieldAssignmentStatus.Active: return 'bg-teal-100 text-teal-800';
    case FieldAssignmentStatus.Pending: return 'bg-yellow-100 text-yellow-800';
    case FieldAssignmentStatus.Proposed: return 'bg-blue-100 text-blue-800';
    case FieldAssignmentStatus.OnHold: return 'bg-orange-100 text-orange-800';
    case FieldAssignmentStatus.Completed: return 'bg-gray-100 text-gray-800';
    case FieldAssignmentStatus.Cancelled: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

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

export function FieldAssignmentsPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuthStore();
  const canManage = hasRole(AppRole.OfficeManager) || hasRole(AppRole.TenantAdmin) || hasRole(AppRole.SysAdmin);

  const [statusFilter, setStatusFilter] = useState<FieldAssignmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<FieldAssignment | null>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['field-assignments', statusFilter, activeOnly],
    queryFn: () => facilitiesPortalService.getFieldAssignments({
      status: statusFilter === 'all' ? undefined : statusFilter,
      activeOnly,
    }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => facilitiesPortalService.approveFieldAssignment(id),
    onSuccess: () => {
      toast.success('Assignment approved');
      queryClient.invalidateQueries({ queryKey: ['field-assignments'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve assignment');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => facilitiesPortalService.completeFieldAssignment(id),
    onSuccess: () => {
      toast.success('Assignment marked as completed');
      queryClient.invalidateQueries({ queryKey: ['field-assignments'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete assignment');
    },
  });

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      assignment.employee?.displayName?.toLowerCase().includes(query) ||
      assignment.employee?.email?.toLowerCase().includes(query) ||
      assignment.clientSite?.name?.toLowerCase().includes(query)
    );
  });

  // Summary stats
  const activeCount = assignments.filter(a => a.status === FieldAssignmentStatus.Active).length;
  const pendingCount = assignments.filter(a => a.status === FieldAssignmentStatus.Pending || a.status === FieldAssignmentStatus.Proposed).length;
  const scifRequired = assignments.filter(a => a.requiresScifAccess && a.status === FieldAssignmentStatus.Active).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Assignments</h1>
          <p className="text-gray-600 mt-1">Manage employee assignments to client sites</p>
        </div>
        <Link
          to="/facilities/client-sites"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          View Client Sites
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendingCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <svg className={`w-5 h-5 ${pendingCount > 0 ? 'text-yellow-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{pendingCount}</p>
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
              <p className="text-sm text-gray-600">SCIF Access Required</p>
              <p className="text-2xl font-bold text-gray-900">{scifRequired}</p>
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
                placeholder="Search by employee or site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as FieldAssignmentStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value={FieldAssignmentStatus.Proposed}>Proposed</option>
            <option value={FieldAssignmentStatus.Pending}>Pending</option>
            <option value={FieldAssignmentStatus.Active}>Active</option>
            <option value={FieldAssignmentStatus.OnHold}>On Hold</option>
            <option value={FieldAssignmentStatus.Completed}>Completed</option>
            <option value={FieldAssignmentStatus.Cancelled}>Cancelled</option>
          </select>

          {/* Active Only */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            Active Only
          </label>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clearance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirements</th>
                <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-lg font-medium">No assignments found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{assignment.employee?.displayName || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{assignment.employee?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{assignment.clientSite?.name || 'Unknown'}</p>
                      {assignment.badgeNumber && (
                        <p className="text-sm text-gray-500">Badge: {assignment.badgeNumber}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <p>{format(parseISO(assignment.startDate), 'MMM d, yyyy')}</p>
                      {assignment.endDate ? (
                        <p className="text-gray-500">to {format(parseISO(assignment.endDate), 'MMM d, yyyy')}</p>
                      ) : (
                        <p className="text-gray-500">Ongoing</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getClearanceColor(assignment.requiredClearance)}`}>
                        {getClearanceLabel(assignment.requiredClearance)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                        {getStatusLabel(assignment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {assignment.requiresScifAccess && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800" title="SCIF Access Required">
                            SCIF
                          </span>
                        )}
                        {assignment.requiresCac && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800" title="CAC Required">
                            CAC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="text-teal-600 hover:text-teal-700"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {canManage && assignment.status === FieldAssignmentStatus.Pending && (
                          <button
                            onClick={() => approveMutation.mutate(assignment.id)}
                            disabled={approveMutation.isPending}
                            className="text-teal-600 hover:text-teal-700"
                            title="Approve"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {canManage && assignment.status === FieldAssignmentStatus.Active && (
                          <button
                            onClick={() => completeMutation.mutate(assignment.id)}
                            disabled={completeMutation.isPending}
                            className="text-gray-600 hover:text-gray-700"
                            title="Mark Complete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAssignment(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Assignment Details</h2>
              <button onClick={() => setSelectedAssignment(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Employee</h3>
                <p className="font-medium text-gray-900">{selectedAssignment.employee?.displayName}</p>
                <p className="text-sm text-gray-600">{selectedAssignment.employee?.email}</p>
              </div>

              {/* Client Site */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Client Site</h3>
                <p className="font-medium text-gray-900">{selectedAssignment.clientSite?.name}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                  <p className="text-gray-900">{format(parseISO(selectedAssignment.startDate), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
                  <p className="text-gray-900">{selectedAssignment.endDate ? format(parseISO(selectedAssignment.endDate), 'MMMM d, yyyy') : 'Ongoing'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Required Clearance</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getClearanceColor(selectedAssignment.requiredClearance)}`}>
                    {getClearanceLabel(selectedAssignment.requiredClearance)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAssignment.status)}`}>
                    {getStatusLabel(selectedAssignment.status)}
                  </span>
                </div>
              </div>

              {/* Badge & Access */}
              {(selectedAssignment.badgeNumber || selectedAssignment.workSchedule) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedAssignment.badgeNumber && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Badge Number</h3>
                      <p className="text-gray-900">{selectedAssignment.badgeNumber}</p>
                    </div>
                  )}
                  {selectedAssignment.workSchedule && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Work Schedule</h3>
                      <p className="text-gray-900">{selectedAssignment.workSchedule}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Requirements */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAssignment.requiresScifAccess && (
                    <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                      SCIF Access Required
                    </span>
                  )}
                  {selectedAssignment.requiresCac && (
                    <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                      CAC Required
                    </span>
                  )}
                  {!selectedAssignment.requiresScifAccess && !selectedAssignment.requiresCac && (
                    <span className="text-sm text-gray-500">No special requirements</span>
                  )}
                </div>
              </div>

              {/* Access Instructions */}
              {selectedAssignment.accessInstructions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Access Instructions</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedAssignment.accessInstructions}</p>
                </div>
              )}

              {/* Notes */}
              {selectedAssignment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedAssignment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
