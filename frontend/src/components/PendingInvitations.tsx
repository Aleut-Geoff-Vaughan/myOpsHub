import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userInvitationsService } from '../services/userInvitationsService';
import type { UserInvitation, InvitationStatus } from '../services/userInvitationsService';
import { Card, CardHeader, CardBody } from './ui';
import { AppRole } from '../types/api';

interface PendingInvitationsProps {
  tenantId?: string;
}

export function PendingInvitations({ tenantId }: PendingInvitationsProps) {
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading, error } = useQuery({
    queryKey: ['pendingInvitations', tenantId],
    queryFn: () => userInvitationsService.getPendingInvitations(tenantId),
  });

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) => userInvitationsService.resendInvitation(invitationId),
    onSuccess: () => {
      toast.success('Invitation resent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resend invitation');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => userInvitationsService.cancelInvitation(invitationId),
    onSuccess: () => {
      toast.success('Invitation cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['pendingInvitations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invitation');
    },
  });

  const getRoleBadgeColor = (role: AppRole): string => {
    switch (role) {
      case AppRole.SystemAdmin:
        return 'bg-red-100 text-red-700';
      case AppRole.TenantAdmin:
        return 'bg-purple-100 text-purple-700';
      case AppRole.Executive:
        return 'bg-yellow-100 text-yellow-700';
      case AppRole.ProjectManager:
      case AppRole.ResourceManager:
      case AppRole.OfficeManager:
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: AppRole): string => {
    switch (role) {
      case AppRole.Employee:
        return 'Employee';
      case AppRole.ViewOnly:
        return 'View Only';
      case AppRole.TeamLead:
        return 'Team Lead';
      case AppRole.ProjectManager:
        return 'Project Manager';
      case AppRole.ResourceManager:
        return 'Resource Manager';
      case AppRole.OfficeManager:
        return 'Office Manager';
      case AppRole.TenantAdmin:
        return 'Tenant Admin';
      case AppRole.Executive:
        return 'Executive';
      case AppRole.OverrideApprover:
        return 'Override Approver';
      case AppRole.SystemAdmin:
        return 'System Admin';
      case AppRole.Support:
        return 'Support';
      case AppRole.Auditor:
        return 'Auditor';
      default:
        return 'Unknown';
    }
  };

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    } else {
      return 'Expiring soon';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Pending Invitations" />
        <CardBody>
          <div className="text-center py-8 text-gray-500">Loading invitations...</div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Pending Invitations" />
        <CardBody>
          <div className="text-center py-8 text-red-500">
            Failed to load invitations. Please try again.
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Pending Invitations"
        subtitle={`${invitations.length} pending ${invitations.length === 1 ? 'invitation' : 'invitations'}`}
      />
      <CardBody>
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending invitations
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Email */}
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-gray-900 truncate">{invitation.email}</span>
                    </div>

                    {/* Tenant */}
                    {invitation.tenant && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">{invitation.tenant.name}</span>
                      </div>
                    )}

                    {/* Roles */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {invitation.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(role)}`}
                        >
                          {getRoleLabel(role)}
                        </span>
                      ))}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Sent {new Date(invitation.createdAt).toLocaleDateString()}</span>
                      <span className="text-orange-600 font-medium">
                        {getTimeRemaining(invitation.expiresAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => resendMutation.mutate(invitation.id)}
                      disabled={resendMutation.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Resend invitation email"
                    >
                      <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resend
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to cancel this invitation?')) {
                          cancelMutation.mutate(invitation.id);
                        }
                      }}
                      disabled={cancelMutation.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancel invitation"
                    >
                      <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
