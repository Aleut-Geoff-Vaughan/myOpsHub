import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useAccount, useCreateAccount, useUpdateAccount, useAccounts } from '../../hooks/useSalesOps';
import { type CreateAccountDto, type UpdateAccountDto } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

// Account type options
const accountTypeOptions = [
  { value: 'Federal', label: 'Federal' },
  { value: 'State', label: 'State' },
  { value: 'Local', label: 'Local' },
  { value: 'International', label: 'International' },
  { value: 'Commercial', label: 'Commercial' },
];

// Federal department options (common agencies)
const federalDepartmentOptions = [
  { value: 'Department of Defense', label: 'Department of Defense (DoD)' },
  { value: 'Department of Homeland Security', label: 'Department of Homeland Security (DHS)' },
  { value: 'Department of Health and Human Services', label: 'Department of Health and Human Services (HHS)' },
  { value: 'Department of Veterans Affairs', label: 'Department of Veterans Affairs (VA)' },
  { value: 'Department of Justice', label: 'Department of Justice (DOJ)' },
  { value: 'Department of State', label: 'Department of State' },
  { value: 'Department of Treasury', label: 'Department of Treasury' },
  { value: 'Department of Energy', label: 'Department of Energy (DOE)' },
  { value: 'Department of Transportation', label: 'Department of Transportation (DOT)' },
  { value: 'Department of Agriculture', label: 'Department of Agriculture (USDA)' },
  { value: 'Department of Commerce', label: 'Department of Commerce' },
  { value: 'Department of Interior', label: 'Department of Interior (DOI)' },
  { value: 'Department of Labor', label: 'Department of Labor (DOL)' },
  { value: 'Department of Education', label: 'Department of Education' },
  { value: 'Department of Housing and Urban Development', label: 'Department of Housing and Urban Development (HUD)' },
  { value: 'Environmental Protection Agency', label: 'Environmental Protection Agency (EPA)' },
  { value: 'General Services Administration', label: 'General Services Administration (GSA)' },
  { value: 'National Aeronautics and Space Administration', label: 'NASA' },
  { value: 'Social Security Administration', label: 'Social Security Administration (SSA)' },
  { value: 'Other', label: 'Other' },
];

// Input field component
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

function InputField({ label, name, value, onChange, type = 'text', required, placeholder }: InputFieldProps) {
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
    </div>
  );
}

// Select field component
interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

function SelectField({ label, name, value, onChange, options, required, placeholder }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// TextArea field component
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

// Checkbox field
interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function CheckboxField({ label, name, checked, onChange }: CheckboxFieldProps) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
      />
      <label htmlFor={name} className="ml-2 text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
}

// Form section
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Form data interface
interface FormData {
  name: string;
  acronym: string;
  description: string;
  parentAccountId: string;
  accountType: string;
  federalDepartment: string;
  portfolio: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  website: string;
  notes: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  acronym: '',
  description: '',
  parentAccountId: '',
  accountType: 'Federal',
  federalDepartment: '',
  portfolio: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA',
  phone: '',
  website: '',
  notes: '',
  isActive: true,
};

export function SalesOpsAccountFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Fetch existing account if editing
  const { data: account, isLoading: accountLoading } = useAccount(id);

  // Fetch all accounts for parent selection
  const { data: allAccounts } = useAccounts();

  // Mutations
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && account) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: account.name,
        acronym: account.acronym || '',
        description: account.description || '',
        parentAccountId: account.parentAccountId || '',
        accountType: account.accountType || 'Federal',
        federalDepartment: account.federalDepartment || '',
        portfolio: account.portfolio || '',
        address: account.address || '',
        city: account.city || '',
        state: account.state || '',
        postalCode: account.postalCode || '',
        country: account.country || 'USA',
        phone: account.phone || '',
        website: account.website || '',
        notes: account.notes || '',
        isActive: account.isActive,
      });
    }
  }, [isEditMode, account]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
      toast.error('Account name is required');
      return;
    }

    try {
      if (isEditMode) {
        const updateData: UpdateAccountDto = {
          name: formData.name,
          acronym: formData.acronym || undefined,
          description: formData.description || undefined,
          parentAccountId: formData.parentAccountId || undefined,
          accountType: formData.accountType || undefined,
          federalDepartment: formData.federalDepartment || undefined,
          portfolio: formData.portfolio || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          notes: formData.notes || undefined,
          isActive: formData.isActive,
        };

        await updateMutation.mutateAsync({ id: id!, data: updateData });
        toast.success('Account updated successfully');
        navigate(`/salesops/accounts/${id}`);
      } else {
        const createData: CreateAccountDto = {
          name: formData.name,
          acronym: formData.acronym || undefined,
          description: formData.description || undefined,
          parentAccountId: formData.parentAccountId || undefined,
          accountType: formData.accountType || undefined,
          federalDepartment: formData.federalDepartment || undefined,
          portfolio: formData.portfolio || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          notes: formData.notes || undefined,
        };

        const newAccount = await createMutation.mutateAsync(createData);
        toast.success('Account created successfully');
        navigate(`/salesops/accounts/${newAccount.id}`);
      }
    } catch {
      toast.error(isEditMode ? 'Failed to update account' : 'Failed to create account');
    }
  };

  const isLoading = accountLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Filter out current account from parent options (can't be own parent)
  const parentAccountOptions = (allAccounts || [])
    .filter((a) => a.id !== id && a.isActive)
    .map((a) => ({
      value: a.id,
      label: a.acronym ? `${a.name} (${a.acronym})` : a.name,
    }));

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
            to={isEditMode ? `/salesops/accounts/${id}` : '/salesops/accounts'}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {isEditMode ? 'Back to Account' : 'Back to Accounts'}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Account' : 'New Account'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormSection title="Basic Information">
          <div className="lg:col-span-2">
            <InputField
              label="Account Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Air Force Materiel Command"
            />
          </div>
          <InputField
            label="Acronym"
            name="acronym"
            value={formData.acronym}
            onChange={handleChange}
            placeholder="e.g., AFMC"
          />
          <SelectField
            label="Account Type"
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            options={accountTypeOptions}
          />
          <SelectField
            label="Federal Department"
            name="federalDepartment"
            value={formData.federalDepartment}
            onChange={handleChange}
            options={federalDepartmentOptions}
            placeholder="Select department"
          />
          <InputField
            label="Portfolio"
            name="portfolio"
            value={formData.portfolio}
            onChange={handleChange}
            placeholder="e.g., Defense"
          />
          <SelectField
            label="Parent Account"
            name="parentAccountId"
            value={formData.parentAccountId}
            onChange={handleChange}
            options={parentAccountOptions}
            placeholder="Select parent account (optional)"
          />
          <div className="lg:col-span-3">
            <TextAreaField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of the account"
            />
          </div>
        </FormSection>

        {/* Contact Information */}
        <FormSection title="Contact Information">
          <InputField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            type="tel"
            placeholder="(555) 123-4567"
          />
          <div className="lg:col-span-2">
            <InputField
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              type="url"
              placeholder="https://www.example.gov"
            />
          </div>
        </FormSection>

        {/* Address */}
        <FormSection title="Address">
          <div className="lg:col-span-3">
            <InputField
              label="Street Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St"
            />
          </div>
          <InputField
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Washington"
          />
          <InputField
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="DC"
          />
          <InputField
            label="Postal Code"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="20001"
          />
          <InputField
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="USA"
          />
        </FormSection>

        {/* Notes */}
        <FormSection title="Notes">
          <div className="lg:col-span-3">
            <TextAreaField
              label="Internal Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Additional notes about this account..."
            />
          </div>
          {isEditMode && (
            <div className="flex items-end">
              <CheckboxField
                label="Account is Active"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
            </div>
          )}
        </FormSection>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Link
            to={isEditMode ? `/salesops/accounts/${id}` : '/salesops/accounts'}
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
            {isSaving ? 'Saving...' : isEditMode ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalesOpsAccountFormPage;
