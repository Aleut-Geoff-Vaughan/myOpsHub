import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  useStages,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useReorderStages,
  useSeedDefaultStages,
} from '../../hooks/useSalesOps';
import { type SalesStage, type CreateStageDto, type UpdateStageDto } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

// Color options for stages
const colorOptions = [
  { value: '#6b7280', label: 'Gray' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#22c55e', label: 'Green' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
];

interface StageFormData {
  name: string;
  code: string;
  description: string;
  defaultProbability: number;
  color: string;
  isWonStage: boolean;
  isLostStage: boolean;
  isClosedStage: boolean;
  isActive: boolean;
}

const initialFormData: StageFormData = {
  name: '',
  code: '',
  description: '',
  defaultProbability: 50,
  color: '#6b7280',
  isWonStage: false,
  isLostStage: false,
  isClosedStage: false,
  isActive: true,
};

// Stage form component (inline editing)
interface StageFormProps {
  stage?: SalesStage;
  onSave: (data: StageFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function StageForm({ stage, onSave, onCancel, isSaving }: StageFormProps) {
  const [formData, setFormData] = useState<StageFormData>(
    stage
      ? {
          name: stage.name,
          code: stage.code || '',
          description: stage.description || '',
          defaultProbability: stage.defaultProbability,
          color: stage.color || '#6b7280',
          isWonStage: stage.isWonStage,
          isLostStage: stage.isLostStage,
          isClosedStage: stage.isClosedStage,
          isActive: stage.isActive,
        }
      : initialFormData
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));

    // Handle mutually exclusive checkboxes
    if (name === 'isWonStage' && checked) {
      setFormData((prev) => ({ ...prev, isLostStage: false, isClosedStage: true }));
    } else if (name === 'isLostStage' && checked) {
      setFormData((prev) => ({ ...prev, isWonStage: false, isClosedStage: true }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Stage name is required');
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g., Qualified"
          />
        </div>
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Code
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g., QUAL"
          />
        </div>
        <div>
          <label htmlFor="defaultProbability" className="block text-sm font-medium text-gray-700 mb-1">
            Default Probability %
          </label>
          <input
            type="number"
            id="defaultProbability"
            name="defaultProbability"
            value={formData.defaultProbability}
            onChange={handleChange}
            min={0}
            max={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="flex gap-2">
            <select
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {colorOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div
              className="w-10 h-10 rounded-lg border border-gray-300"
              style={{ backgroundColor: formData.color }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Optional description"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isWonStage"
            checked={formData.isWonStage}
            onChange={handleChange}
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Won Stage</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isLostStage"
            checked={formData.isLostStage}
            onChange={handleChange}
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Lost Stage</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isClosedStage"
            checked={formData.isClosedStage}
            onChange={handleChange}
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Closed Stage</span>
        </label>
        {stage && (
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm"
        >
          <Check className="h-4 w-4 mr-1" />
          {isSaving ? 'Saving...' : stage ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

// Stage row component
interface StageRowProps {
  stage: SalesStage;
  index: number;
  totalCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isReordering: boolean;
}

function StageRow({
  stage,
  index,
  totalCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isReordering,
}: StageRowProps) {
  return (
    <tr className={`${!stage.isActive ? 'bg-gray-50 text-gray-500' : ''}`}>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0 || isReordering}
              className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === totalCount - 1 || isReordering}
              className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
          <span className="text-sm text-gray-500 w-6">{index + 1}</span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color || '#6b7280' }}
          />
          <span className="font-medium">{stage.name}</span>
          {stage.code && <span className="text-xs text-gray-500">({stage.code})</span>}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <span className="text-sm">{stage.defaultProbability}%</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <div className="flex justify-center gap-1">
          {stage.isWonStage && (
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800">Won</span>
          )}
          {stage.isLostStage && (
            <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">Lost</span>
          )}
          {stage.isClosedStage && !stage.isWonStage && !stage.isLostStage && (
            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">Closed</span>
          )}
          {!stage.isClosedStage && (
            <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">Open</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        {stage.isActive ? (
          <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">Active</span>
        ) : (
          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">Inactive</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
            title="Edit stage"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete stage"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function SalesOpsStagesPage() {
  // Fetch stages (including inactive)
  const { data: stages, isLoading, error } = useStages(true);

  // Mutations
  const createMutation = useCreateStage();
  const updateMutation = useUpdateStage();
  const deleteMutation = useDeleteStage();
  const reorderMutation = useReorderStages();
  const seedMutation = useSeedDefaultStages();

  // UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [orderedStages, setOrderedStages] = useState<SalesStage[]>([]);

  // Update local state when stages change
  useEffect(() => {
    if (stages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrderedStages([...stages].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [stages]);

  // Handle create
  const handleCreate = async (formData: StageFormData) => {
    try {
      const data: CreateStageDto = {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        defaultProbability: formData.defaultProbability,
        color: formData.color,
        isWonStage: formData.isWonStage,
        isLostStage: formData.isLostStage,
        isClosedStage: formData.isClosedStage,
      };
      await createMutation.mutateAsync(data);
      toast.success('Stage created successfully');
      setShowAddForm(false);
    } catch {
      toast.error('Failed to create stage');
    }
  };

  // Handle update
  const handleUpdate = async (formData: StageFormData) => {
    if (!editingStageId) return;
    try {
      const data: UpdateStageDto = {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        defaultProbability: formData.defaultProbability,
        color: formData.color,
        isWonStage: formData.isWonStage,
        isLostStage: formData.isLostStage,
        isClosedStage: formData.isClosedStage,
        isActive: formData.isActive,
      };
      await updateMutation.mutateAsync({ id: editingStageId, data });
      toast.success('Stage updated successfully');
      setEditingStageId(null);
    } catch {
      toast.error('Failed to update stage');
    }
  };

  // Handle delete
  const handleDelete = async (stage: SalesStage) => {
    if (!confirm(`Are you sure you want to delete "${stage.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(stage.id);
      toast.success('Stage deleted successfully');
    } catch {
      toast.error('Failed to delete stage. It may have associated opportunities.');
    }
  };

  // Handle reorder
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedStages];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedStages(newOrder);

    try {
      await reorderMutation.mutateAsync(newOrder.map((s) => s.id));
      toast.success('Stage order updated');
    } catch {
      toast.error('Failed to reorder stages');
      // Revert on error
      if (stages) {
        setOrderedStages([...stages].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === orderedStages.length - 1) return;
    const newOrder = [...orderedStages];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedStages(newOrder);

    try {
      await reorderMutation.mutateAsync(newOrder.map((s) => s.id));
      toast.success('Stage order updated');
    } catch {
      toast.error('Failed to reorder stages');
      // Revert on error
      if (stages) {
        setOrderedStages([...stages].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    }
  };

  // Handle seed defaults
  const handleSeedDefaults = async () => {
    if (!confirm('This will create default pipeline stages. Continue?')) {
      return;
    }
    try {
      await seedMutation.mutateAsync();
      toast.success('Default stages created successfully');
    } catch {
      toast.error('Failed to create default stages');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading stages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/salesops/settings"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Settings
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading stages. Please try again.</p>
        </div>
      </div>
    );
  }

  const editingStage = editingStageId ? orderedStages.find((s) => s.id === editingStageId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/salesops/settings"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Stages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure the stages in your sales pipeline. Drag to reorder.
          </p>
        </div>
        <div className="flex gap-2">
          {(!stages || stages.length === 0) && (
            <button
              type="button"
              onClick={handleSeedDefaults}
              disabled={seedMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {seedMutation.isPending ? 'Creating...' : 'Create Defaults'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setEditingStageId(null);
            }}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Stage
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <StageForm
          onSave={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isSaving={createMutation.isPending}
        />
      )}

      {/* Stages Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Probability
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Type
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orderedStages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No stages configured. Click "Add Stage" or "Create Defaults" to get started.
                </td>
              </tr>
            ) : (
              orderedStages.map((stage, index) =>
                editingStageId === stage.id ? (
                  <tr key={stage.id}>
                    <td colSpan={6} className="p-4">
                      <StageForm
                        stage={editingStage!}
                        onSave={handleUpdate}
                        onCancel={() => setEditingStageId(null)}
                        isSaving={updateMutation.isPending}
                      />
                    </td>
                  </tr>
                ) : (
                  <StageRow
                    key={stage.id}
                    stage={stage}
                    index={index}
                    totalCount={orderedStages.length}
                    onEdit={() => {
                      setEditingStageId(stage.id);
                      setShowAddForm(false);
                    }}
                    onDelete={() => handleDelete(stage)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    isReordering={reorderMutation.isPending}
                  />
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Stage Configuration Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Won Stage</strong>: Mark one stage as "Won" to track closed-won opportunities</li>
          <li>• <strong>Lost Stage</strong>: Mark one stage as "Lost" to track closed-lost opportunities</li>
          <li>• <strong>Closed Stage</strong>: Any stage where opportunities are no longer active</li>
          <li>• <strong>Default Probability</strong>: Auto-set on opportunities when moved to this stage</li>
          <li>• Inactive stages won't appear in the pipeline board but existing opportunities are preserved</li>
        </ul>
      </div>
    </div>
  );
}

export default SalesOpsStagesPage;
