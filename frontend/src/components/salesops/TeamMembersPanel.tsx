import { useState } from 'react';
import {
  Users,
  Plus,
  Star,
  Trash2,
  Edit2,
  Loader2,
  Check,
  Mail,
} from 'lucide-react';
import {
  useOpportunityTeamMembers,
  useAddOpportunityTeamMember,
  useUpdateOpportunityTeamMember,
  useRemoveOpportunityTeamMember,
} from '../../hooks/useSalesOps';
import type { TeamMember, CreateTeamMemberDto, UpdateTeamMemberDto } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

// Common roles for team members
const COMMON_ROLES = [
  'Capture Manager',
  'Proposal Manager',
  'Solution Architect',
  'Technical Lead',
  'Pricing Lead',
  'Contracts Lead',
  'Subject Matter Expert',
  'Business Development',
  'Executive Sponsor',
];

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface TeamMemberFormProps {
  opportunityId: string;
  member?: TeamMember;
  users: User[];
  onCancel: () => void;
  onSuccess: () => void;
}

function TeamMemberForm({
  opportunityId,
  member,
  users,
  onCancel,
  onSuccess,
}: TeamMemberFormProps) {
  const isEditing = !!member;
  const [userId, setUserId] = useState(member?.userId || '');
  const [role, setRole] = useState(member?.role || '');
  const [customRole, setCustomRole] = useState('');
  const [isPrimary, setIsPrimary] = useState(member?.isPrimary || false);
  const [notes, setNotes] = useState(member?.notes || '');

  const addMutation = useAddOpportunityTeamMember();
  const updateMutation = useUpdateOpportunityTeamMember();

  const isPending = addMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    const finalRole = role === '__custom__' ? customRole : role;

    if (!isEditing && !userId) {
      toast.error('Please select a team member');
      return;
    }

    try {
      if (isEditing && member) {
        const data: UpdateTeamMemberDto = {
          role: finalRole || undefined,
          isPrimary,
          notes: notes || undefined,
        };
        await updateMutation.mutateAsync({
          opportunityId,
          teamMemberId: member.id,
          data,
        });
        toast.success('Team member updated');
      } else {
        const data: CreateTeamMemberDto = {
          userId,
          role: finalRole || undefined,
          isPrimary,
          notes: notes || undefined,
        };
        await addMutation.mutateAsync({ opportunityId, data });
        toast.success('Team member added');
      }
      onSuccess();
    } catch {
      toast.error('Failed to save team member');
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      {!isEditing && (
        <div>
          <label htmlFor="team-member-user" className="block text-sm font-medium text-gray-700 mb-1">
            Team Member
          </label>
          <select
            id="team-member-user"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName || user.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="team-member-role" className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          id="team-member-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="">No specific role</option>
          {COMMON_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
          <option value="__custom__">Custom role...</option>
        </select>
        {role === '__custom__' && (
          <input
            type="text"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            placeholder="Enter custom role"
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="team-member-primary"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <label htmlFor="team-member-primary" className="text-sm text-gray-700">
          Primary team member (Capture Manager)
        </label>
      </div>

      <div>
        <label htmlFor="team-member-notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="team-member-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes about this team member's involvement..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending || (!isEditing && !userId)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isEditing ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  );
}

interface TeamMembersPanelProps {
  opportunityId: string;
  users?: User[];
}

export function TeamMembersPanel({ opportunityId, users = [] }: TeamMembersPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: teamMembers, isLoading } = useOpportunityTeamMembers(opportunityId);
  const removeMutation = useRemoveOpportunityTeamMember();

  const handleRemove = async (teamMemberId: string) => {
    if (confirmDelete !== teamMemberId) {
      setConfirmDelete(teamMemberId);
      return;
    }

    try {
      await removeMutation.mutateAsync({ opportunityId, teamMemberId });
      toast.success('Team member removed');
      setConfirmDelete(null);
    } catch {
      toast.error('Failed to remove team member');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          Team ({teamMembers?.length || 0})
        </h3>
        {!showForm && !editingMember && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingMember) && (
        <TeamMemberForm
          opportunityId={opportunityId}
          member={editingMember || undefined}
          users={users}
          onCancel={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
        />
      )}

      {/* Team Members List */}
      {teamMembers && teamMembers.length > 0 ? (
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 group"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {member.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{member.userName}</span>
                  {member.isPrimary && (
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>
                {member.role && (
                  <span className="text-sm text-gray-600">{member.role}</span>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Mail className="h-3 w-3" />
                  {member.userEmail}
                </div>
                {member.notes && (
                  <p className="text-sm text-gray-500 mt-1">{member.notes}</p>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <button
                  onClick={() => setEditingMember(member)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {confirmDelete === member.id && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center gap-2 rounded-lg">
                  <span className="text-sm text-red-600">Remove?</span>
                  <button
                    onClick={() => handleRemove(member.id)}
                    disabled={removeMutation.isPending}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                  >
                    {removeMutation.isPending ? '...' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="text-center py-4 text-gray-500">
            <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No team members assigned</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-orange-600 hover:text-orange-700 mt-1"
            >
              Add the first team member
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default TeamMembersPanel;
