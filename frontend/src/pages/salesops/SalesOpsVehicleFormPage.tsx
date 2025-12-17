import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Calendar, DollarSign } from 'lucide-react';
import {
  useContractVehicle,
  useCreateContractVehicle,
  useUpdateContractVehicle,
  useBiddingEntities,
} from '../../hooks/useSalesOps';
import { type CreateContractVehicleDto, type UpdateContractVehicleDto } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

// Common vehicle types for federal government
const VEHICLE_TYPES = [
  'GSA Schedule',
  'GWAC',
  'BPA',
  'IDIQ',
  'MAC',
  'OASIS',
  'STARS',
  'SEWP',
  'CIO-SP3',
  'Other',
];

// Form section component
function FormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center space-x-2">
        <Icon className="h-5 w-5 text-gray-500" />
        <span className="font-medium text-gray-900">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function SalesOpsVehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Fetch contract vehicle if editing
  const { data: vehicle, isLoading: isLoadingVehicle } = useContractVehicle(id);

  // Fetch bidding entities for dropdown
  const { data: biddingEntities } = useBiddingEntities();

  // Mutations
  const createVehicle = useCreateContractVehicle();
  const updateVehicle = useUpdateContractVehicle();

  // Form state
  const [formData, setFormData] = useState<CreateContractVehicleDto>({
    name: '',
    contractNumber: '',
    description: '',
    vehicleType: '',
    issuingAgency: '',
    awardDate: '',
    startDate: '',
    endDate: '',
    expirationDate: '',
    ceilingValue: undefined,
    awardedValue: undefined,
    eligibilityNotes: '',
    biddingEntityId: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when vehicle loads
  useEffect(() => {
    if (vehicle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: vehicle.name || '',
        contractNumber: vehicle.contractNumber || '',
        description: vehicle.description || '',
        vehicleType: vehicle.vehicleType || '',
        issuingAgency: vehicle.issuingAgency || '',
        awardDate: vehicle.awardDate?.split('T')[0] || '',
        startDate: vehicle.startDate?.split('T')[0] || '',
        endDate: vehicle.endDate?.split('T')[0] || '',
        expirationDate: vehicle.expirationDate?.split('T')[0] || '',
        ceilingValue: vehicle.ceilingValue || undefined,
        awardedValue: vehicle.awardedValue || undefined,
        eligibilityNotes: vehicle.eligibilityNotes || '',
        biddingEntityId: vehicle.biddingEntityId || undefined,
      });
    }
  }, [vehicle]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let processedValue: string | number | undefined = value;

    // Handle number fields
    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue || undefined,
    }));

    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditMode && id) {
        const updateData: UpdateContractVehicleDto = {
          name: formData.name,
          contractNumber: formData.contractNumber || undefined,
          description: formData.description || undefined,
          vehicleType: formData.vehicleType || undefined,
          issuingAgency: formData.issuingAgency || undefined,
          awardDate: formData.awardDate || undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          expirationDate: formData.expirationDate || undefined,
          ceilingValue: formData.ceilingValue,
          awardedValue: formData.awardedValue,
          eligibilityNotes: formData.eligibilityNotes || undefined,
          biddingEntityId: formData.biddingEntityId || undefined,
        };
        await updateVehicle.mutateAsync({ id, data: updateData });
        toast.success('Contract vehicle updated');
        navigate(`/salesops/vehicles/${id}`);
      } else {
        const result = await createVehicle.mutateAsync(formData);
        toast.success('Contract vehicle created');
        navigate(`/salesops/vehicles/${result.id}`);
      }
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update contract vehicle' : 'Failed to create contract vehicle');
      console.error('Contract vehicle save error:', error);
    }
  };

  if (isEditMode && isLoadingVehicle) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const isSaving = createVehicle.isPending || updateVehicle.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={isEditMode ? `/salesops/vehicles/${id}` : '/salesops/vehicles'}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEditMode ? 'Back to Contract Vehicle' : 'Back to Contract Vehicles'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Contract Vehicle' : 'New Contract Vehicle'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditMode
            ? 'Update contract vehicle information'
            : 'Add a new IDIQ, GWAC, GSA Schedule, or other contract vehicle'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormSection title="Basic Information" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., GSA IT Schedule 70, OASIS SB Pool 1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Number
              </label>
              <input
                type="text"
                name="contractNumber"
                value={formData.contractNumber || ''}
                onChange={handleChange}
                placeholder="e.g., GS-35F-0123X"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                name="vehicleType"
                value={formData.vehicleType || ''}
                onChange={handleChange}
                aria-label="Select vehicle type"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">-- Select Type --</option>
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issuing Agency
              </label>
              <input
                type="text"
                name="issuingAgency"
                value={formData.issuingAgency || ''}
                onChange={handleChange}
                placeholder="e.g., GSA, NASA, DHS"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bidding Entity
              </label>
              <select
                name="biddingEntityId"
                value={formData.biddingEntityId || ''}
                onChange={handleChange}
                aria-label="Select bidding entity"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">-- Select Bidding Entity --</option>
                {biddingEntities?.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                    {entity.shortName ? ` (${entity.shortName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of the contract vehicle..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </FormSection>

        {/* Key Dates */}
        <FormSection title="Key Dates" icon={Calendar}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Award Date</label>
              <input
                type="date"
                name="awardDate"
                value={formData.awardDate || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used for expiration tracking and alerts
              </p>
            </div>
          </div>
        </FormSection>

        {/* Financial */}
        <FormSection title="Financial" icon={DollarSign}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ceiling Value ($)
              </label>
              <input
                type="number"
                name="ceilingValue"
                value={formData.ceilingValue || ''}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum contract value
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Awarded Value ($)
              </label>
              <input
                type="number"
                name="awardedValue"
                value={formData.awardedValue || ''}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Total task orders awarded to date
              </p>
            </div>
          </div>
        </FormSection>

        {/* Eligibility Notes */}
        <FormSection title="Eligibility Notes" icon={FileText}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Eligibility & Notes
            </label>
            <textarea
              name="eligibilityNotes"
              value={formData.eligibilityNotes || ''}
              onChange={handleChange}
              rows={4}
              placeholder="Notes about eligibility requirements, scope, labor categories, special instructions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </FormSection>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          <Link
            to={isEditMode ? `/salesops/vehicles/${id}` : '/salesops/vehicles'}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalesOpsVehicleFormPage;
