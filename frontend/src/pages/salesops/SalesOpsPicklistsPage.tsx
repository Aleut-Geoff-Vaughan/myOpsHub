import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  GripVertical,
  Check,
  X,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  usePicklists,
  useUpdatePicklist,
  useAddPicklistValue,
  useUpdatePicklistValue,
  useDeletePicklistValue,
  useSeedDefaultPicklists,
} from '../../hooks/useSalesOps';
import type {
  SalesPicklistDefinition,
  SalesPicklistValue,
  CreatePicklistValueDto,
  UpdatePicklistValueDto,
} from '../../services/salesOpsService';
import toast from 'react-hot-toast';

export function SalesOpsPicklistsPage() {
  const { data: picklists, isLoading, error } = usePicklists({ includeInactive: true });
  const seedDefaults = useSeedDefaultPicklists();

  const [expandedPicklists, setExpandedPicklists] = useState<Set<string>>(new Set());
  const [editingValue, setEditingValue] = useState<{
    picklistId: string;
    valueId: string | null;
    data: Partial<SalesPicklistValue>;
  } | null>(null);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedPicklists);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPicklists(newExpanded);
  };

  const handleSeedDefaults = async () => {
    try {
      await seedDefaults.mutateAsync();
      toast.success('Default picklists created');
    } catch {
      toast.error('Failed to seed default picklists');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">Failed to load picklists</span>
        </div>
      </div>
    );
  }

  const hasPicklists = picklists && picklists.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/salesops/settings"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Picklist Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure dropdown values for opportunity fields
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!hasPicklists && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No picklists configured</h3>
          <p className="text-gray-500 mb-6">
            Seed the default system picklists to get started with Acquisition Type, Contract Type,
            Opportunity Status, and Portfolio.
          </p>
          <button
            onClick={handleSeedDefaults}
            disabled={seedDefaults.isPending}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {seedDefaults.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Seed Default Picklists
              </>
            )}
          </button>
        </div>
      )}

      {/* Picklists List */}
      {hasPicklists && (
        <div className="space-y-4">
          {picklists.map((picklist) => (
            <PicklistCard
              key={picklist.id}
              picklist={picklist}
              isExpanded={expandedPicklists.has(picklist.id)}
              onToggle={() => toggleExpand(picklist.id)}
              editingValue={editingValue}
              setEditingValue={setEditingValue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Picklist Card Component
// ============================================================================

interface PicklistCardProps {
  picklist: SalesPicklistDefinition;
  isExpanded: boolean;
  onToggle: () => void;
  editingValue: {
    picklistId: string;
    valueId: string | null;
    data: Partial<SalesPicklistValue>;
  } | null;
  setEditingValue: (
    value: {
      picklistId: string;
      valueId: string | null;
      data: Partial<SalesPicklistValue>;
    } | null
  ) => void;
}

function PicklistCard({
  picklist,
  isExpanded,
  onToggle,
  editingValue,
  setEditingValue,
}: PicklistCardProps) {
  const updatePicklist = useUpdatePicklist();
  const addValue = useAddPicklistValue();
  const updateValue = useUpdatePicklistValue();
  const deleteValue = useDeletePicklistValue();

  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState<CreatePicklistValueDto>({
    value: '',
    label: '',
    color: '',
    isDefault: false,
  });

  const activeValues = picklist.values.filter((v) => v.isActive);
  const inactiveValues = picklist.values.filter((v) => !v.isActive);

  const handleToggleActive = async () => {
    try {
      await updatePicklist.mutateAsync({
        id: picklist.id,
        data: { isActive: !picklist.isActive },
      });
      toast.success(picklist.isActive ? 'Picklist deactivated' : 'Picklist activated');
    } catch {
      toast.error('Failed to update picklist');
    }
  };

  const handleAddValue = async () => {
    if (!newValue.value.trim()) {
      toast.error('Value is required');
      return;
    }

    try {
      await addValue.mutateAsync({
        picklistId: picklist.id,
        data: {
          ...newValue,
          label: newValue.label || newValue.value,
        },
      });
      toast.success('Value added');
      setIsAdding(false);
      setNewValue({ value: '', label: '', color: '', isDefault: false });
    } catch {
      toast.error('Failed to add value');
    }
  };

  const handleUpdateValue = async (valueId: string, data: UpdatePicklistValueDto) => {
    try {
      await updateValue.mutateAsync({
        picklistId: picklist.id,
        valueId,
        data,
      });
      setEditingValue(null);
      toast.success('Value updated');
    } catch {
      toast.error('Failed to update value');
    }
  };

  const handleDeleteValue = async (valueId: string) => {
    if (!confirm('Are you sure you want to deactivate this value?')) return;

    try {
      await deleteValue.mutateAsync({
        picklistId: picklist.id,
        valueId,
      });
      toast.success('Value deactivated');
    } catch {
      toast.error('Failed to deactivate value');
    }
  };

  const handleReactivateValue = async (valueId: string) => {
    try {
      await updateValue.mutateAsync({
        picklistId: picklist.id,
        valueId,
        data: { isActive: true },
      });
      toast.success('Value reactivated');
    } catch {
      toast.error('Failed to reactivate value');
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border ${picklist.isActive ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{picklist.displayLabel}</span>
              {picklist.isSystemPicklist && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  <Lock className="h-3 w-3 mr-1" />
                  System
                </span>
              )}
              {!picklist.isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {picklist.picklistName} &middot; {activeValues.length} active value
              {activeValues.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          {!picklist.isSystemPicklist && (
            <button
              onClick={handleToggleActive}
              className={`px-3 py-1 text-sm rounded ${
                picklist.isActive
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-green-600 hover:bg-green-50'
              }`}
            >
              {picklist.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Values Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Label
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Default
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeValues.map((value) => (
                  <ValueRow
                    key={value.id}
                    value={value}
                    picklistId={picklist.id}
                    isEditing={
                      editingValue?.picklistId === picklist.id &&
                      editingValue?.valueId === value.id
                    }
                    editingData={
                      editingValue?.picklistId === picklist.id &&
                      editingValue?.valueId === value.id
                        ? editingValue.data
                        : null
                    }
                    onStartEdit={() =>
                      setEditingValue({
                        picklistId: picklist.id,
                        valueId: value.id,
                        data: {
                          label: value.label,
                          color: value.color || '',
                          isDefault: value.isDefault,
                        },
                      })
                    }
                    onCancelEdit={() => setEditingValue(null)}
                    onSaveEdit={(data) => handleUpdateValue(value.id, data)}
                    onDelete={() => handleDeleteValue(value.id)}
                    onUpdateEditingData={(data) =>
                      setEditingValue({
                        picklistId: picklist.id,
                        valueId: value.id,
                        data: { ...editingValue!.data, ...data },
                      })
                    }
                  />
                ))}

                {/* Add New Value Row */}
                {isAdding && (
                  <tr className="bg-orange-50">
                    <td className="px-4 py-2">
                      <GripVertical className="h-4 w-4 text-gray-300" />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={newValue.value}
                        onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
                        placeholder="Value (stored)"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={newValue.label || ''}
                        onChange={(e) => setNewValue({ ...newValue, label: e.target.value })}
                        placeholder="Label (displayed)"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="color"
                        value={newValue.color || '#cccccc'}
                        onChange={(e) => setNewValue({ ...newValue, color: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={newValue.isDefault || false}
                        onChange={(e) => setNewValue({ ...newValue, isDefault: e.target.checked })}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={handleAddValue}
                        disabled={addValue.isPending}
                        className="p-1 text-green-600 hover:text-green-800 mr-1"
                      >
                        {addValue.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setNewValue({ value: '', label: '', color: '', isDefault: false });
                        }}
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Value Button */}
          {!isAdding && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Value
              </button>
            </div>
          )}

          {/* Inactive Values */}
          {inactiveValues.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                Inactive Values ({inactiveValues.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {inactiveValues.map((value) => (
                  <span
                    key={value.id}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-200 text-gray-600"
                  >
                    {value.label}
                    <button
                      onClick={() => handleReactivateValue(value.id)}
                      className="ml-1 text-green-600 hover:text-green-800"
                      title="Reactivate"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Value Row Component
// ============================================================================

interface ValueRowProps {
  value: SalesPicklistValue;
  picklistId: string;
  isEditing: boolean;
  editingData: Partial<SalesPicklistValue> | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (data: UpdatePicklistValueDto) => void;
  onDelete: () => void;
  onUpdateEditingData: (data: Partial<SalesPicklistValue>) => void;
}

function ValueRow({
  value,
  isEditing,
  editingData,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onUpdateEditingData,
}: ValueRowProps) {
  if (isEditing && editingData) {
    return (
      <tr className="bg-orange-50">
        <td className="px-4 py-2">
          <GripVertical className="h-4 w-4 text-gray-300" />
        </td>
        <td className="px-4 py-2">
          <span className="text-sm text-gray-500">{value.value}</span>
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            value={editingData.label || ''}
            onChange={(e) => onUpdateEditingData({ label: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="color"
            value={editingData.color || '#cccccc'}
            onChange={(e) => onUpdateEditingData({ color: e.target.value })}
            className="w-8 h-8 rounded border border-gray-300"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="checkbox"
            checked={editingData.isDefault || false}
            onChange={(e) => onUpdateEditingData({ isDefault: e.target.checked })}
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
        </td>
        <td className="px-4 py-2 text-right">
          <button
            onClick={() =>
              onSaveEdit({
                label: editingData.label,
                color: editingData.color || undefined,
                isDefault: editingData.isDefault,
              })
            }
            className="p-1 text-green-600 hover:text-green-800 mr-1"
          >
            <Check className="h-4 w-4" />
          </button>
          <button onClick={onCancelEdit} className="p-1 text-gray-600 hover:text-gray-800">
            <X className="h-4 w-4" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2">
        <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
      </td>
      <td className="px-4 py-2">
        <span className="text-sm font-mono text-gray-600">{value.value}</span>
      </td>
      <td className="px-4 py-2">
        <span className="text-sm text-gray-900">{value.label}</span>
      </td>
      <td className="px-4 py-2">
        {value.color ? (
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: value.color }}
          />
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-2">
        {value.isDefault && <Check className="h-4 w-4 text-green-600" />}
      </td>
      <td className="px-4 py-2 text-right">
        <button
          onClick={onStartEdit}
          className="p-1 text-gray-600 hover:text-gray-800 mr-1"
          title="Edit"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-red-600 hover:text-red-800"
          title="Deactivate"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

export default SalesOpsPicklistsPage;
