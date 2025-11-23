import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AppRole } from '../types/api';
import { userInvitationsService } from '../services/userInvitationsService';
import type { CreateInvitationRequest } from '../services/userInvitationsService';
import { Modal } from './ui/Modal';
import { RoleSelector } from './RoleSelector';
import { RoleTemplates } from './RoleTemplates';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
  tenantName?: string;
}

export function InviteUserModal({ isOpen, onClose, tenantId, tenantName }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState(tenantId || '');
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [showTemplates, setShowTemplates] = useState(true);
  const queryClient = useQueryClient();

  const createInvitationMutation = useMutation({
    mutationFn: (request: CreateInvitationRequest) => userInvitationsService.createInvitation(request),
    onSuccess: () => {
      toast.success('Invitation sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['pendingInvitations'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  const handleClose = () => {
    setEmail('');
    setSelectedTenantId(tenantId || '');
    setSelectedRoles([]);
    setShowTemplates(true);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !selectedTenantId || selectedRoles.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    createInvitationMutation.mutate({
      email,
      tenantId: selectedTenantId,
      roles: selectedRoles,
    });
  };

  const handleTemplateSelect = (roles: AppRole[]) => {
    setSelectedRoles(roles);
    setShowTemplates(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite New User" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={createInvitationMutation.isPending}
          />
          <p className="mt-1 text-xs text-gray-500">
            The user will receive an invitation email with a link to accept and create their account.
          </p>
        </div>

        {/* Tenant Selection - Only show if tenantId not provided */}
        {!tenantId && (
          <div>
            <label htmlFor="tenant" className="block text-sm font-medium text-gray-700 mb-2">
              Tenant <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tenant"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              placeholder="Enter Tenant ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={createInvitationMutation.isPending}
            />
          </div>
        )}

        {/* Tenant Display - Show if tenantId provided */}
        {tenantId && tenantName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{tenantName}</p>
              <p className="text-xs text-gray-500">{tenantId}</p>
            </div>
          </div>
        )}

        {/* Role Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Roles <span className="text-red-500">*</span>
            </label>
            {!showTemplates && (
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Show Templates
              </button>
            )}
          </div>

          {showTemplates ? (
            <RoleTemplates
              onSelectTemplate={handleTemplateSelect}
              disabled={createInvitationMutation.isPending}
              showSystemRoles={false}
            />
          ) : (
            <div className="space-y-3">
              <RoleSelector
                selectedRoles={selectedRoles}
                onChange={setSelectedRoles}
                disabled={createInvitationMutation.isPending}
                showSystemRoles={false}
              />
              {selectedRoles.length === 0 && (
                <p className="text-sm text-red-500">Please select at least one role</p>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={createInvitationMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={createInvitationMutation.isPending || selectedRoles.length === 0}
          >
            {createInvitationMutation.isPending ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
