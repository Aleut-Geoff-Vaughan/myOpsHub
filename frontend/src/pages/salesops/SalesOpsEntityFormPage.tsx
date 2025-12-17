import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, X, Building2 } from 'lucide-react';
import {
  useBiddingEntity,
  useCreateBiddingEntity,
  useUpdateBiddingEntity,
} from '../../hooks/useSalesOps';
import type { CreateBiddingEntityDto, UpdateBiddingEntityDto } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

// Form field components
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  helpText,
}: InputFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string;
}

function CheckboxField({ label, name, checked, onChange, description }: CheckboxFieldProps) {
  return (
    <div className="flex items-start">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-1"
      />
      <div className="ml-3">
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
}

function TextAreaField({ label, name, value, onChange, rows = 3, placeholder }: TextAreaFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>
  );
}

// Section wrapper component
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// Initial form state
interface FormData {
  name: string;
  legalName: string;
  shortName: string;
  dunsNumber: string;
  cageCode: string;
  ueiNumber: string;
  taxId: string;
  is8a: boolean;
  sbaEntryDate: string;
  sbaExpirationDate: string;
  sbaGraduationDate: string;
  isSmallBusiness: boolean;
  isSDVOSB: boolean;
  isVOSB: boolean;
  isWOSB: boolean;
  isEDWOSB: boolean;
  isHUBZone: boolean;
  isSDB: boolean;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
}

const initialFormData: FormData = {
  name: '',
  legalName: '',
  shortName: '',
  dunsNumber: '',
  cageCode: '',
  ueiNumber: '',
  taxId: '',
  is8a: false,
  sbaEntryDate: '',
  sbaExpirationDate: '',
  sbaGraduationDate: '',
  isSmallBusiness: false,
  isSDVOSB: false,
  isVOSB: false,
  isWOSB: false,
  isEDWOSB: false,
  isHUBZone: false,
  isSDB: false,
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA',
  notes: '',
};

export function SalesOpsEntityFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Fetch existing entity if editing
  const { data: entity, isLoading: entityLoading } = useBiddingEntity(id);

  // Mutations
  const createMutation = useCreateBiddingEntity();
  const updateMutation = useUpdateBiddingEntity();

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && entity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: entity.name,
        legalName: entity.legalName || '',
        shortName: entity.shortName || '',
        dunsNumber: entity.dunsNumber || '',
        cageCode: entity.cageCode || '',
        ueiNumber: entity.ueiNumber || '',
        taxId: entity.taxId || '',
        is8a: entity.is8a,
        sbaEntryDate: entity.sbaEntryDate?.split('T')[0] || '',
        sbaExpirationDate: entity.sbaExpirationDate?.split('T')[0] || '',
        sbaGraduationDate: entity.sbaGraduationDate?.split('T')[0] || '',
        isSmallBusiness: entity.isSmallBusiness,
        isSDVOSB: entity.isSDVOSB,
        isVOSB: entity.isVOSB,
        isWOSB: entity.isWOSB,
        isEDWOSB: entity.isEDWOSB,
        isHUBZone: entity.isHUBZone,
        isSDB: entity.isSDB,
        address: entity.address || '',
        city: entity.city || '',
        state: entity.state || '',
        postalCode: entity.postalCode || '',
        country: entity.country || 'USA',
        notes: entity.notes || '',
      });
    }
  }, [isEditMode, entity]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Entity name is required');
      return;
    }

    try {
      if (isEditMode) {
        const updateData: UpdateBiddingEntityDto = {
          name: formData.name,
          legalName: formData.legalName || undefined,
          shortName: formData.shortName || undefined,
          dunsNumber: formData.dunsNumber || undefined,
          cageCode: formData.cageCode || undefined,
          ueiNumber: formData.ueiNumber || undefined,
          taxId: formData.taxId || undefined,
          is8a: formData.is8a,
          sbaEntryDate: formData.sbaEntryDate || undefined,
          sbaExpirationDate: formData.sbaExpirationDate || undefined,
          sbaGraduationDate: formData.sbaGraduationDate || undefined,
          isSmallBusiness: formData.isSmallBusiness,
          isSDVOSB: formData.isSDVOSB,
          isVOSB: formData.isVOSB,
          isWOSB: formData.isWOSB,
          isEDWOSB: formData.isEDWOSB,
          isHUBZone: formData.isHUBZone,
          isSDB: formData.isSDB,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          notes: formData.notes || undefined,
        };

        await updateMutation.mutateAsync({ id: id!, data: updateData });
        toast.success('Entity updated successfully');
        navigate(`/salesops/entities/${id}`);
      } else {
        const createData: CreateBiddingEntityDto = {
          name: formData.name,
          legalName: formData.legalName || undefined,
          shortName: formData.shortName || undefined,
          dunsNumber: formData.dunsNumber || undefined,
          cageCode: formData.cageCode || undefined,
          ueiNumber: formData.ueiNumber || undefined,
          taxId: formData.taxId || undefined,
          is8a: formData.is8a,
          sbaEntryDate: formData.sbaEntryDate || undefined,
          sbaExpirationDate: formData.sbaExpirationDate || undefined,
          sbaGraduationDate: formData.sbaGraduationDate || undefined,
          isSmallBusiness: formData.isSmallBusiness,
          isSDVOSB: formData.isSDVOSB,
          isVOSB: formData.isVOSB,
          isWOSB: formData.isWOSB,
          isEDWOSB: formData.isEDWOSB,
          isHUBZone: formData.isHUBZone,
          isSDB: formData.isSDB,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          notes: formData.notes || undefined,
        };

        const newEntity = await createMutation.mutateAsync(createData);
        toast.success('Entity created successfully');
        navigate(`/salesops/entities/${newEntity.id}`);
      }
    } catch {
      toast.error(isEditMode ? 'Failed to update entity' : 'Failed to create entity');
    }
  };

  const isLoading = entityLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={isEditMode ? `/salesops/entities/${id}` : '/salesops/entities'}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {isEditMode ? 'Back to Entity' : 'Back to Entities'}
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="h-6 w-6 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Bidding Entity' : 'New Bidding Entity'}
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormSection title="Basic Information" description="Entity identification details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InputField
                label="Entity Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., ABC Company LLC"
              />
            </div>
            <InputField
              label="Legal Name"
              name="legalName"
              value={formData.legalName}
              onChange={handleChange}
              placeholder="Full legal entity name"
              helpText="If different from display name"
            />
            <InputField
              label="Short Name"
              name="shortName"
              value={formData.shortName}
              onChange={handleChange}
              placeholder="e.g., ABC"
            />
          </div>
        </FormSection>

        {/* Business Identifiers */}
        <FormSection title="Business Identifiers" description="Government registration numbers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="CAGE Code"
              name="cageCode"
              value={formData.cageCode}
              onChange={handleChange}
              placeholder="5-character code"
              helpText="Commercial and Government Entity code"
            />
            <InputField
              label="UEI Number"
              name="ueiNumber"
              value={formData.ueiNumber}
              onChange={handleChange}
              placeholder="12-character UEI"
              helpText="Unique Entity ID (replaced DUNS)"
            />
            <InputField
              label="DUNS Number"
              name="dunsNumber"
              value={formData.dunsNumber}
              onChange={handleChange}
              placeholder="9-digit number"
              helpText="Legacy identifier (being phased out)"
            />
            <InputField
              label="Tax ID / EIN"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              placeholder="XX-XXXXXXX"
            />
          </div>
        </FormSection>

        {/* 8(a) Program */}
        <FormSection
          title="SBA 8(a) Program"
          description="Track 8(a) Business Development Program participation"
        >
          <div className="space-y-4">
            <CheckboxField
              label="Participant in 8(a) Program"
              name="is8a"
              checked={formData.is8a}
              onChange={handleChange}
              description="Check if this entity is enrolled in the SBA 8(a) Business Development Program"
            />

            {formData.is8a && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <InputField
                  label="8(a) Entry Date"
                  name="sbaEntryDate"
                  type="date"
                  value={formData.sbaEntryDate}
                  onChange={handleChange}
                  helpText="Date entered the 8(a) program"
                />
                <InputField
                  label="8(a) Expiration Date"
                  name="sbaExpirationDate"
                  type="date"
                  value={formData.sbaExpirationDate}
                  onChange={handleChange}
                  helpText="Certification expiration date"
                />
                <InputField
                  label="8(a) Graduation Date"
                  name="sbaGraduationDate"
                  type="date"
                  value={formData.sbaGraduationDate}
                  onChange={handleChange}
                  helpText="Projected graduation date"
                />
              </div>
            )}
          </div>
        </FormSection>

        {/* Other Certifications */}
        <FormSection title="Certifications" description="Select all applicable certifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CheckboxField
              label="Small Business (SB)"
              name="isSmallBusiness"
              checked={formData.isSmallBusiness}
              onChange={handleChange}
              description="Meets SBA size standards"
            />
            <CheckboxField
              label="Small Disadvantaged Business (SDB)"
              name="isSDB"
              checked={formData.isSDB}
              onChange={handleChange}
              description="51% owned by socially/economically disadvantaged individuals"
            />
            <CheckboxField
              label="Service-Disabled Veteran-Owned (SDVOSB)"
              name="isSDVOSB"
              checked={formData.isSDVOSB}
              onChange={handleChange}
              description="Owned by service-disabled veterans"
            />
            <CheckboxField
              label="Veteran-Owned (VOSB)"
              name="isVOSB"
              checked={formData.isVOSB}
              onChange={handleChange}
              description="Owned by veterans"
            />
            <CheckboxField
              label="Women-Owned (WOSB)"
              name="isWOSB"
              checked={formData.isWOSB}
              onChange={handleChange}
              description="51% owned by women"
            />
            <CheckboxField
              label="Economically Disadvantaged WOSB (EDWOSB)"
              name="isEDWOSB"
              checked={formData.isEDWOSB}
              onChange={handleChange}
              description="WOSB with economic disadvantage"
            />
            <CheckboxField
              label="HUBZone"
              name="isHUBZone"
              checked={formData.isHUBZone}
              onChange={handleChange}
              description="Located in Historically Underutilized Business Zone"
            />
          </div>
        </FormSection>

        {/* Address */}
        <FormSection title="Address" description="Business address (optional)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InputField
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street, Suite 100"
              />
            </div>
            <InputField
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="VA"
              />
              <InputField
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="22201"
              />
            </div>
            <InputField
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="USA"
            />
          </div>
        </FormSection>

        {/* Notes */}
        <FormSection title="Notes" description="Additional information about this entity">
          <TextAreaField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Enter any additional notes or comments..."
          />
        </FormSection>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Link
            to={isEditMode ? `/salesops/entities/${id}` : '/salesops/entities'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : isEditMode ? 'Update Entity' : 'Create Entity'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalesOpsEntityFormPage;
