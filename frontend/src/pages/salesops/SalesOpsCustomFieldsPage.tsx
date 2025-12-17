import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Check,
  Loader2,
  SlidersHorizontal,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  Link as LinkIcon,
  Mail,
  Phone,
  FileText,
  Percent,
  DollarSign,
  Clock,
  Search,
} from 'lucide-react';
import {
  useCustomFieldDefinitions,
  useCreateCustomFieldDefinition,
  useUpdateCustomFieldDefinition,
  useDeleteCustomFieldDefinition,
  useSeedDefaultFieldDefinitions,
} from '../../hooks/useSalesOps';
import { CustomFieldType, type CreateCustomFieldDto, type CustomFieldDefinition } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

// Field type configuration
const fieldTypeConfig: Record<
  CustomFieldType,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  [CustomFieldType.Text]: { label: 'Text', icon: Type, description: 'Single line text' },
  [CustomFieldType.TextArea]: { label: 'Text Area', icon: FileText, description: 'Multi-line text' },
  [CustomFieldType.Number]: { label: 'Number', icon: Hash, description: 'Numeric value' },
  [CustomFieldType.Currency]: { label: 'Currency', icon: DollarSign, description: 'Dollar amount' },
  [CustomFieldType.Percent]: { label: 'Percent', icon: Percent, description: 'Percentage value' },
  [CustomFieldType.Date]: { label: 'Date', icon: Calendar, description: 'Date picker' },
  [CustomFieldType.DateTime]: { label: 'Date & Time', icon: Clock, description: 'Date and time' },
  [CustomFieldType.Checkbox]: { label: 'Checkbox', icon: CheckSquare, description: 'Yes/No toggle' },
  [CustomFieldType.Picklist]: { label: 'Picklist', icon: List, description: 'Single select dropdown' },
  [CustomFieldType.MultiPicklist]: { label: 'Multi-Select', icon: List, description: 'Multiple selection' },
  [CustomFieldType.Lookup]: { label: 'Lookup', icon: Search, description: 'Reference to another record' },
  [CustomFieldType.Url]: { label: 'URL', icon: LinkIcon, description: 'Web link' },
  [CustomFieldType.Email]: { label: 'Email', icon: Mail, description: 'Email address' },
  [CustomFieldType.Phone]: { label: 'Phone', icon: Phone, description: 'Phone number' },
};

// Entity type options
const entityTypes = [
  { value: 'Opportunity', label: 'Opportunity' },
  { value: 'Account', label: 'Account' },
  { value: 'Contact', label: 'Contact' },
  { value: 'ContractVehicle', label: 'Contract Vehicle' },
];

// Field type icon component
function FieldTypeIcon({ fieldType }: { fieldType: CustomFieldType }) {
  const config = fieldTypeConfig[fieldType];
  if (!config) return null;
  const Icon = config.icon;
  return <Icon className="h-4 w-4 text-gray-400" />;
}

// Add/Edit Field Modal
function FieldModal({
  isOpen,
  onClose,
  field,
  entityType,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  field?: CustomFieldDefinition;
  entityType: string;
  onSave: (data: CreateCustomFieldDto) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    entityType: field?.entityType || entityType,
    fieldName: field?.fieldName || '',
    displayLabel: field?.displayLabel || '',
    fieldType: field?.fieldType ?? CustomFieldType.Text,
    picklistOptions: field?.picklistOptions || '',
    defaultValue: field?.defaultValue || '',
    isRequired: field?.isRequired || false,
    isSearchable: field?.isSearchable || false,
    isVisibleInList: field?.isVisibleInList || false,
    section: field?.section || '',
    helpText: field?.helpText || '',
    lookupEntityType: field?.lookupEntityType || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fieldName || !formData.displayLabel) {
      toast.error('Field name and display label are required');
      return;
    }
    onSave({
      ...formData,
      picklistOptions: formData.picklistOptions || undefined,
      defaultValue: formData.defaultValue || undefined,
      section: formData.section || undefined,
      helpText: formData.helpText || undefined,
      lookupEntityType: formData.lookupEntityType || undefined,
    });
  };

  const needsPicklistOptions =
    formData.fieldType === CustomFieldType.Picklist ||
    formData.fieldType === CustomFieldType.MultiPicklist;

  const needsLookupConfig = formData.fieldType === CustomFieldType.Lookup;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {field ? 'Edit Custom Field' : 'Add Custom Field'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayLabel}
                onChange={(e) => {
                  setFormData({ ...formData, displayLabel: e.target.value });
                  // Auto-generate field name from label if creating new field
                  if (!field) {
                    const fieldName = e.target.value
                      .replace(/[^a-zA-Z0-9\s]/g, '')
                      .replace(/\s+/g, '_')
                      .toLowerCase();
                    setFormData((prev) => ({ ...prev, displayLabel: e.target.value, fieldName }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Contract Duration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Field Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fieldName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fieldName: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., contract_duration"
                disabled={!!field}
              />
              {field && (
                <p className="text-xs text-gray-500 mt-1">Field name cannot be changed after creation</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="field-entity-type" className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type <span className="text-red-500">*</span>
              </label>
              <select
                id="field-entity-type"
                value={formData.entityType}
                onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={!!field}
              >
                {entityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="field-type" className="block text-sm font-medium text-gray-700 mb-1">
                Field Type <span className="text-red-500">*</span>
              </label>
              <select
                id="field-type"
                value={formData.fieldType}
                onChange={(e) =>
                  setFormData({ ...formData, fieldType: parseInt(e.target.value) as CustomFieldType })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={!!field}
              >
                {Object.entries(fieldTypeConfig).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label} - {config.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {needsPicklistOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Picklist Options (JSON array)
              </label>
              <textarea
                value={formData.picklistOptions}
                onChange={(e) => setFormData({ ...formData, picklistOptions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder='["Option 1", "Option 2", "Option 3"]'
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">Enter options as a JSON array</p>
            </div>
          )}

          {needsLookupConfig && (
            <div>
              <label htmlFor="field-lookup-entity-type" className="block text-sm font-medium text-gray-700 mb-1">Lookup Entity Type</label>
              <select
                id="field-lookup-entity-type"
                value={formData.lookupEntityType}
                onChange={(e) => setFormData({ ...formData, lookupEntityType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select entity type...</option>
                {entityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
                <option value="User">User</option>
                <option value="BiddingEntity">Bidding Entity</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Additional Information"
              />
              <p className="text-xs text-gray-500 mt-1">Group fields by section in forms</p>
            </div>
            <div>
              <label htmlFor="field-default-value" className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
              <input
                id="field-default-value"
                type="text"
                value={formData.defaultValue}
                onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Optional default value"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Help Text</label>
            <input
              type="text"
              value={formData.helpText}
              onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Instructions for users filling out this field"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSearchable}
                onChange={(e) => setFormData({ ...formData, isSearchable: e.target.checked })}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Searchable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVisibleInList}
                onChange={(e) => setFormData({ ...formData, isVisibleInList: e.target.checked })}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Show in List View</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {field ? 'Update Field' : 'Create Field'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SalesOpsCustomFieldsPage() {
  const [selectedEntity, setSelectedEntity] = useState('Opportunity');
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | undefined>();

  const { data: fields, isLoading, error } = useCustomFieldDefinitions({
    entityType: selectedEntity,
    includeInactive: showInactive,
  });

  const createMutation = useCreateCustomFieldDefinition();
  const updateMutation = useUpdateCustomFieldDefinition();
  const deleteMutation = useDeleteCustomFieldDefinition();
  const seedMutation = useSeedDefaultFieldDefinitions();

  const handleSeedDefaults = () => {
    seedMutation.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(`Created ${result.created} default fields (${result.existing} already existed)`);
      },
      onError: () => {
        toast.error('Failed to seed default fields');
      },
    });
  };

  const handleCreateField = (data: CreateCustomFieldDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Custom field created');
        setIsModalOpen(false);
      },
      onError: () => {
        toast.error('Failed to create custom field');
      },
    });
  };

  const handleUpdateField = (data: CreateCustomFieldDto) => {
    if (!editingField) return;
    updateMutation.mutate(
      { id: editingField.id, data },
      {
        onSuccess: () => {
          toast.success('Custom field updated');
          setIsModalOpen(false);
          setEditingField(undefined);
        },
        onError: () => {
          toast.error('Failed to update custom field');
        },
      }
    );
  };

  const handleDeleteField = (field: CustomFieldDefinition) => {
    if (!window.confirm(`Are you sure you want to deactivate "${field.displayLabel}"?`)) return;
    deleteMutation.mutate(field.id, {
      onSuccess: () => {
        toast.success('Custom field deactivated');
      },
      onError: () => {
        toast.error('Failed to deactivate custom field');
      },
    });
  };

  const openEditModal = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingField(undefined);
  };

  // Group fields by section
  const fieldsBySection = (fields || []).reduce(
    (acc, field) => {
      const section = field.section || 'General';
      if (!acc[section]) acc[section] = [];
      acc[section].push(field);
      return acc;
    },
    {} as Record<string, CustomFieldDefinition[]>
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Custom Fields</h1>
          <p className="mt-1 text-sm text-gray-500">
            Define custom fields for opportunities, accounts, and contacts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={seedMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            {seedMutation.isPending ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <SlidersHorizontal className="h-5 w-5 mr-2" />
            )}
            Seed Default Fields
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Field
          </button>
        </div>
      </div>

      {/* Entity Type Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-4">
            <nav className="flex -mb-px">
              {entityTypes.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  onClick={() => setSelectedEntity(type.value)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedEntity === type.value
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </nav>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              Show inactive
            </label>
          </div>
        </div>

        {/* Fields List */}
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">Failed to load custom fields</div>
        ) : !fields || fields.length === 0 ? (
          <div className="p-12">
            <div className="text-center">
              <SlidersHorizontal className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No custom fields for {selectedEntity}
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Add custom fields to capture additional information specific to your organization's
                needs.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add {selectedEntity} Field
                </button>
              </div>
              <div className="mt-6 text-sm text-gray-500">
                <p className="font-medium mb-2">Available field types:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.values(fieldTypeConfig).map((config) => (
                    <span key={config.label} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {config.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(fieldsBySection).map(([section, sectionFields]) => (
              <div key={section}>
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700">{section}</h3>
                </div>
                {sectionFields.map((field) => (
                  <div
                    key={field.id}
                    className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 ${
                      !field.isActive ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FieldTypeIcon fieldType={field.fieldType} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{field.displayLabel}</span>
                            {field.isRequired && (
                              <span className="text-xs text-red-500">Required</span>
                            )}
                            {!field.isActive && (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{fieldTypeConfig[field.fieldType]?.label}</span>
                            <span>•</span>
                            <code className="text-xs bg-gray-100 px-1 rounded">
                              {field.fieldName}
                            </code>
                            {field.isSearchable && (
                              <>
                                <span>•</span>
                                <span className="text-xs">Searchable</span>
                              </>
                            )}
                            {field.isVisibleInList && (
                              <>
                                <span>•</span>
                                <span className="text-xs">In List</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(field)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Edit field"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {field.isActive && (
                        <button
                          type="button"
                          onClick={() => handleDeleteField(field)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Deactivate field"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Field Modal */}
      <FieldModal
        isOpen={isModalOpen}
        onClose={closeModal}
        field={editingField}
        entityType={selectedEntity}
        onSave={editingField ? handleUpdateField : handleCreateField}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

export default SalesOpsCustomFieldsPage;
