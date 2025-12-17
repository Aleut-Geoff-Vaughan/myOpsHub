import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Clock,
  FileText,
  Linkedin,
  Smartphone,
} from 'lucide-react';
import { useContact, useDeleteContact, useOpportunities } from '../../hooks/useSalesOps';
import toast from 'react-hot-toast';

// Format date
function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format currency
function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Collapsible section component
function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

// Field display component
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value || '-'}</div>
    </div>
  );
}

export function SalesOpsContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch contact
  const { data: contact, isLoading, error } = useContact(id);

  // Fetch related opportunities
  const { data: opportunitiesData } = useOpportunities({
    // Filter by primary contact would be ideal, but we'll show account's opportunities
    accountId: contact?.accountId,
  });

  // Delete mutation
  const deleteContact = useDeleteContact();

  const handleDelete = async () => {
    if (!contact) return;
    if (!confirm(`Are you sure you want to delete contact "${contact.fullName}"?`)) {
      return;
    }
    try {
      await deleteContact.mutateAsync(contact.id);
      toast.success('Contact deleted');
      navigate('/salesops/contacts');
    } catch {
      toast.error('Failed to delete contact');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load contact: {error instanceof Error ? error.message : 'Contact not found'}
        </div>
        <Link
          to="/salesops/contacts"
          className="mt-4 inline-flex items-center text-sm text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Contacts
        </Link>
      </div>
    );
  }

  // Calculate opportunity stats for this contact's account
  const accountOpportunities = opportunitiesData?.items || [];
  const oppStats = {
    count: accountOpportunities.length,
    pipelineValue: accountOpportunities.reduce((sum, opp) => sum + opp.amount, 0),
    weightedValue: accountOpportunities.reduce((sum, opp) => sum + opp.weightedAmount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/salesops/contacts"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Contacts
          </Link>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 font-bold text-xl">
                {contact.firstName?.[0]}{contact.lastName?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {contact.fullName}
                {!contact.isActive && (
                  <span className="ml-2 px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded">
                    Inactive
                  </span>
                )}
              </h1>
              {contact.title && (
                <p className="text-gray-600">{contact.title}</p>
              )}
              {contact.account && (
                <Link
                  to={`/salesops/accounts/${contact.accountId}`}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  {contact.account.name}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/salesops/contacts/${contact.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info Section */}
          <Section title="Contact Information" icon={User} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4">
              <Field label="First Name" value={contact.firstName} />
              <Field label="Last Name" value={contact.lastName} />
              <Field label="Title" value={contact.title} />
              <Field label="Department" value={contact.department} />
              <Field
                label="Account"
                value={
                  contact.account ? (
                    <Link
                      to={`/salesops/accounts/${contact.accountId}`}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {contact.account.name}
                    </Link>
                  ) : (
                    '-'
                  )
                }
              />
              <Field
                label="Status"
                value={
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      contact.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {contact.isActive ? 'Active' : 'Inactive'}
                  </span>
                }
              />
            </div>
          </Section>

          {/* Communication Section */}
          <Section title="Communication" icon={Phone} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4">
              <Field
                label="Email"
                value={
                  contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      {contact.email}
                    </a>
                  ) : (
                    '-'
                  )
                }
              />
              <Field
                label="Phone"
                value={
                  contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-gray-900 flex items-center"
                    >
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      {contact.phone}
                    </a>
                  ) : (
                    '-'
                  )
                }
              />
              <Field
                label="Mobile Phone"
                value={
                  contact.mobilePhone ? (
                    <a
                      href={`tel:${contact.mobilePhone}`}
                      className="text-gray-900 flex items-center"
                    >
                      <Smartphone className="h-4 w-4 mr-1 text-gray-400" />
                      {contact.mobilePhone}
                    </a>
                  ) : (
                    '-'
                  )
                }
              />
              <Field
                label="LinkedIn"
                value={
                  contact.linkedInUrl ? (
                    <a
                      href={contact.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Linkedin className="h-4 w-4 mr-1" />
                      View Profile
                    </a>
                  ) : (
                    '-'
                  )
                }
              />
            </div>
          </Section>

          {/* Mailing Address Section */}
          <Section title="Mailing Address" icon={MapPin} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4">
              <div className="col-span-2">
                <Field label="Street Address" value={contact.mailingAddress} />
              </div>
              <Field label="City" value={contact.mailingCity} />
              <Field label="State" value={contact.mailingState} />
              <Field label="Postal Code" value={contact.mailingPostalCode} />
            </div>
          </Section>

          {/* Notes Section */}
          <Section title="Notes" icon={FileText} defaultOpen={false}>
            <div className="pt-4">
              {contact.notes ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No notes</p>
              )}
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  Send Email
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  Call Office
                </a>
              )}
              {contact.mobilePhone && (
                <a
                  href={`tel:${contact.mobilePhone}`}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Smartphone className="h-4 w-4 mr-2 text-gray-400" />
                  Call Mobile
                </a>
              )}
              {contact.linkedInUrl && (
                <a
                  href={contact.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Linkedin className="h-4 w-4 mr-2 text-gray-400" />
                  View LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Account Info */}
          {contact.account && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Account</h3>
              <Link
                to={`/salesops/accounts/${contact.accountId}`}
                className="flex items-center text-sm text-gray-700 hover:text-orange-600"
              >
                <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                {contact.account.name}
              </Link>
              {oppStats.count > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Opportunities:</span>
                    <span className="font-medium">{oppStats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pipeline:</span>
                    <span className="font-medium">{formatCurrency(oppStats.pipelineValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Weighted:</span>
                    <span className="font-medium">{formatCurrency(oppStats.weightedValue)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">System Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span>Created: {formatDate(contact.createdAt)}</span>
              </div>
              {contact.updatedAt && (
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Updated: {formatDate(contact.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Related Opportunities */}
          {accountOpportunities.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Account Opportunities</h3>
              <div className="space-y-2">
                {accountOpportunities.slice(0, 5).map((opp) => (
                  <Link
                    key={opp.id}
                    to={`/salesops/opportunities/${opp.id}`}
                    className="block p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="text-sm font-medium text-gray-900">{opp.name}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-between mt-1">
                      <span>{opp.stageName}</span>
                      <span>{formatCurrency(opp.amount)}</span>
                    </div>
                  </Link>
                ))}
                {accountOpportunities.length > 5 && (
                  <Link
                    to={`/salesops/opportunities?accountId=${contact.accountId}`}
                    className="block text-sm text-orange-600 hover:text-orange-700 mt-2"
                  >
                    View all {accountOpportunities.length} opportunities
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SalesOpsContactDetailPage;
