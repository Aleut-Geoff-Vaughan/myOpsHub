import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, MapPin, FileText } from 'lucide-react';
import {
  useContact,
  useCreateContact,
  useUpdateContact,
  useAccounts,
} from '../../hooks/useSalesOps';
import { type CreateContactDto, type UpdateContactDto } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

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

export function SalesOpsContactFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Fetch contact if editing
  const { data: contact, isLoading: isLoadingContact } = useContact(id);

  // Fetch accounts for dropdown
  const { data: accounts } = useAccounts();

  // Mutations
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  // Form state
  const [formData, setFormData] = useState<CreateContactDto>({
    firstName: '',
    lastName: '',
    title: '',
    department: '',
    accountId: undefined,
    email: '',
    phone: '',
    mobilePhone: '',
    linkedInUrl: '',
    mailingAddress: '',
    mailingCity: '',
    mailingState: '',
    mailingPostalCode: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when contact loads
  useEffect(() => {
    if (contact) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        title: contact.title || '',
        department: contact.department || '',
        accountId: contact.accountId || undefined,
        email: contact.email || '',
        phone: contact.phone || '',
        mobilePhone: contact.mobilePhone || '',
        linkedInUrl: contact.linkedInUrl || '',
        mailingAddress: contact.mailingAddress || '',
        mailingCity: contact.mailingCity || '',
        mailingState: contact.mailingState || '',
        mailingPostalCode: contact.mailingPostalCode || '',
        notes: contact.notes || '',
      });
    }
  }, [contact]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.linkedInUrl && !formData.linkedInUrl.includes('linkedin.com')) {
      newErrors.linkedInUrl = 'Please enter a valid LinkedIn URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditMode && id) {
        const updateData: UpdateContactDto = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          title: formData.title || undefined,
          department: formData.department || undefined,
          accountId: formData.accountId || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          mobilePhone: formData.mobilePhone || undefined,
          linkedInUrl: formData.linkedInUrl || undefined,
          mailingAddress: formData.mailingAddress || undefined,
          mailingCity: formData.mailingCity || undefined,
          mailingState: formData.mailingState || undefined,
          mailingPostalCode: formData.mailingPostalCode || undefined,
          notes: formData.notes || undefined,
        };
        await updateContact.mutateAsync({ id, data: updateData });
        toast.success('Contact updated');
        navigate(`/salesops/contacts/${id}`);
      } else {
        const result = await createContact.mutateAsync(formData);
        toast.success('Contact created');
        navigate(`/salesops/contacts/${result.id}`);
      }
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update contact' : 'Failed to create contact');
      console.error('Contact save error:', error);
    }
  };

  if (isEditMode && isLoadingContact) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const isSaving = createContact.isPending || updateContact.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={isEditMode ? `/salesops/contacts/${id}` : '/salesops/contacts'}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEditMode ? 'Back to Contact' : 'Back to Contacts'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Contact' : 'New Contact'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditMode
            ? 'Update contact information'
            : 'Add a new contact to your sales database'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormSection title="Basic Information" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                placeholder="e.g., Program Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                placeholder="e.g., IT, Procurement"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                name="accountId"
                value={formData.accountId || ''}
                onChange={handleChange}
                aria-label="Select account"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">-- Select Account --</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                    {account.acronym ? ` (${account.acronym})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        {/* Contact Information */}
        <FormSection title="Contact Information" icon={Phone}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="email@example.gov"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Phone</label>
              <input
                type="tel"
                name="mobilePhone"
                value={formData.mobilePhone || ''}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                type="url"
                name="linkedInUrl"
                value={formData.linkedInUrl || ''}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.linkedInUrl ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.linkedInUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.linkedInUrl}</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* Mailing Address */}
        <FormSection title="Mailing Address" icon={MapPin}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="mailingAddress"
                value={formData.mailingAddress || ''}
                onChange={handleChange}
                placeholder="123 Main Street"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="mailingCity"
                value={formData.mailingCity || ''}
                onChange={handleChange}
                placeholder="Washington"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="mailingState"
                value={formData.mailingState || ''}
                onChange={handleChange}
                placeholder="DC"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                name="mailingPostalCode"
                value={formData.mailingPostalCode || ''}
                onChange={handleChange}
                placeholder="20001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </FormSection>

        {/* Notes */}
        <FormSection title="Notes" icon={FileText}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={4}
              placeholder="Add any additional notes about this contact..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </FormSection>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          <Link
            to={isEditMode ? `/salesops/contacts/${id}` : '/salesops/contacts'}
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
            {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Contact'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalesOpsContactFormPage;
