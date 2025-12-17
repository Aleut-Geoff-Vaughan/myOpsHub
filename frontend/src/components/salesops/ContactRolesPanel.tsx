import { useState } from 'react';
import {
  UserCircle,
  Plus,
  Star,
  Trash2,
  Edit2,
  Loader2,
  Check,
  Mail,
  Phone,
  Building2,
} from 'lucide-react';
import {
  useOpportunityContactRoles,
  useAddOpportunityContactRole,
  useUpdateOpportunityContactRole,
  useRemoveOpportunityContactRole,
  useContacts,
} from '../../hooks/useSalesOps';
import type { ContactRole, CreateContactRoleDto, UpdateContactRoleDto } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

// Common contact roles
const COMMON_ROLES = [
  'Decision Maker',
  'Technical POC',
  'Contracting Officer',
  'Program Manager',
  'End User',
  'Influencer',
  'Evaluator',
  'Budget Holder',
  'Champion',
];

interface ContactRoleFormProps {
  opportunityId: string;
  contactRole?: ContactRole;
  onCancel: () => void;
  onSuccess: () => void;
}

function ContactRoleForm({
  opportunityId,
  contactRole,
  onCancel,
  onSuccess,
}: ContactRoleFormProps) {
  const isEditing = !!contactRole;
  const [contactId, setContactId] = useState(contactRole?.contactId || '');
  const [role, setRole] = useState(contactRole?.role || '');
  const [customRole, setCustomRole] = useState('');
  const [isPrimary, setIsPrimary] = useState(contactRole?.isPrimary || false);
  const [notes, setNotes] = useState(contactRole?.notes || '');

  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const addMutation = useAddOpportunityContactRole();
  const updateMutation = useUpdateOpportunityContactRole();

  const isPending = addMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    const finalRole = role === '__custom__' ? customRole : role;

    if (!isEditing && !contactId) {
      toast.error('Please select a contact');
      return;
    }

    try {
      if (isEditing && contactRole) {
        const data: UpdateContactRoleDto = {
          role: finalRole || undefined,
          isPrimary,
          notes: notes || undefined,
        };
        await updateMutation.mutateAsync({
          opportunityId,
          contactRoleId: contactRole.id,
          data,
        });
        toast.success('Contact role updated');
      } else {
        const data: CreateContactRoleDto = {
          contactId,
          role: finalRole || undefined,
          isPrimary,
          notes: notes || undefined,
        };
        await addMutation.mutateAsync({ opportunityId, data });
        toast.success('Contact added');
      }
      onSuccess();
    } catch {
      toast.error('Failed to save contact role');
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      {!isEditing && (
        <div>
          <label htmlFor="contact-role-contact" className="block text-sm font-medium text-gray-700 mb-1">
            Contact
          </label>
          <select
            id="contact-role-contact"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            disabled={contactsLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select a contact...</option>
            {contacts?.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
                {contact.account && ` (${contact.account.name})`}
              </option>
            ))}
          </select>
          {contacts?.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              No contacts available. Create contacts first.
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="contact-role-role" className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          id="contact-role-role"
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
          id="contact-role-primary"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <label htmlFor="contact-role-primary" className="text-sm text-gray-700">
          Primary contact for this opportunity
        </label>
      </div>

      <div>
        <label htmlFor="contact-role-notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="contact-role-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes about this contact's role..."
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
          disabled={isPending || (!isEditing && !contactId)}
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

interface ContactRolesPanelProps {
  opportunityId: string;
}

export function ContactRolesPanel({ opportunityId }: ContactRolesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<ContactRole | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: contactRoles, isLoading } = useOpportunityContactRoles(opportunityId);
  const removeMutation = useRemoveOpportunityContactRole();

  const handleRemove = async (contactRoleId: string) => {
    if (confirmDelete !== contactRoleId) {
      setConfirmDelete(contactRoleId);
      return;
    }

    try {
      await removeMutation.mutateAsync({ opportunityId, contactRoleId });
      toast.success('Contact removed');
      setConfirmDelete(null);
    } catch {
      toast.error('Failed to remove contact');
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
          <UserCircle className="h-4 w-4 text-gray-500" />
          Contacts ({contactRoles?.length || 0})
        </h3>
        {!showForm && !editingRole && (
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
      {(showForm || editingRole) && (
        <ContactRoleForm
          opportunityId={opportunityId}
          contactRole={editingRole || undefined}
          onCancel={() => {
            setShowForm(false);
            setEditingRole(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingRole(null);
          }}
        />
      )}

      {/* Contact Roles List */}
      {contactRoles && contactRoles.length > 0 ? (
        <div className="space-y-2">
          {contactRoles.map((cr) => (
            <div
              key={cr.id}
              className="relative flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 group"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {cr.contactName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{cr.contactName}</span>
                  {cr.isPrimary && (
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>
                {cr.contactTitle && (
                  <span className="text-sm text-gray-600">{cr.contactTitle}</span>
                )}
                {cr.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                    {cr.role}
                  </span>
                )}
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  {cr.accountName && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {cr.accountName}
                    </span>
                  )}
                  {cr.contactEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {cr.contactEmail}
                    </span>
                  )}
                  {cr.contactPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {cr.contactPhone}
                    </span>
                  )}
                </div>
                {cr.notes && (
                  <p className="text-sm text-gray-500 mt-1">{cr.notes}</p>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <button
                  onClick={() => setEditingRole(cr)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleRemove(cr.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {confirmDelete === cr.id && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center gap-2 rounded-lg">
                  <span className="text-sm text-red-600">Remove?</span>
                  <button
                    onClick={() => handleRemove(cr.id)}
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
            <UserCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No contacts assigned</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-orange-600 hover:text-orange-700 mt-1"
            >
              Add a contact
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default ContactRolesPanel;
