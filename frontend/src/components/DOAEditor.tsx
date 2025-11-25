import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  useDOALetter,
  useCreateDOALetter,
  useUpdateDOALetter,
} from '../hooks/useDOA';
import type { CreateDOALetterRequest } from '../types/doa';
import { useUsers } from '../hooks/useTenants';

interface DOAEditorProps {
  doaId: string | null;
  onClose: () => void;
}

export function DOAEditor({ doaId, onClose }: DOAEditorProps) {
  const isEdit = !!doaId;
  const { data: doa, isLoading: isLoadingDOA } = useDOALetter(doaId!);
  const { data: users = [] } = useUsers();

  const createMutation = useCreateDOALetter();
  const updateMutation = useUpdateDOALetter();

  const [formData, setFormData] = useState<CreateDOALetterRequest>({
    designeeUserId: '',
    letterContent: '',
    effectiveStartDate: format(new Date(), 'yyyy-MM-dd'),
    effectiveEndDate: format(
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      'yyyy-MM-dd'
    ),
    isFinancialAuthority: false,
    isOperationalAuthority: false,
    notes: '',
  });

  useEffect(() => {
    if (doa) {
      setFormData({
        designeeUserId: doa.designeeUserId,
        letterContent: doa.letterContent,
        effectiveStartDate: format(new Date(doa.effectiveStartDate), 'yyyy-MM-dd'),
        effectiveEndDate: format(new Date(doa.effectiveEndDate), 'yyyy-MM-dd'),
        isFinancialAuthority: doa.isFinancialAuthority,
        isOperationalAuthority: doa.isOperationalAuthority,
        notes: doa.notes || '',
      });
    }
  }, [doa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.designeeUserId) {
      toast.error('Please select a designee');
      return;
    }

    if (!formData.letterContent.trim()) {
      toast.error('Please enter letter content');
      return;
    }

    if (!formData.isFinancialAuthority && !formData.isOperationalAuthority) {
      toast.error('Please select at least one authority type');
      return;
    }

    try {
      if (isEdit && doaId) {
        await updateMutation.mutateAsync({
          id: doaId,
          request: { ...formData, id: doaId },
        });
        toast.success('DOA letter updated successfully');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('DOA letter created successfully');
      }
      onClose();
    } catch (error) {
      toast.error(
        isEdit ? 'Failed to update DOA letter' : 'Failed to create DOA letter'
      );
    }
  };

  if (isEdit && isLoadingDOA) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit DOA Letter' : 'Create DOA Letter'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Designee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designee <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.designeeUserId}
              onChange={(e) =>
                setFormData({ ...formData, designeeUserId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a designee...</option>
              {users.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName || person.name || person.email} ({person.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Person to whom authority will be delegated
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effectiveStartDate}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveStartDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effectiveEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveEndDate: e.target.value })
                }
                min={formData.effectiveStartDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Authority Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authority Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFinancialAuthority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isFinancialAuthority: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Financial Authority
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isOperationalAuthority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isOperationalAuthority: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Operational Authority
                </span>
              </label>
            </div>
          </div>

          {/* Letter Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Letter Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.letterContent}
              onChange={(e) =>
                setFormData({ ...formData, letterContent: e.target.value })
              }
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Enter the delegation of authority letter content..."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Formal letter specifying the scope and limitations of delegated authority
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional internal notes (not visible in the official letter)..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEdit
                ? 'Update DOA Letter'
                : 'Create DOA Letter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
