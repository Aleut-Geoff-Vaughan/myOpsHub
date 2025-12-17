import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, Phone, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { useAccounts, useDeleteAccount } from '../../hooks/useSalesOps';
import { type SalesAccount } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

type SortField = 'name' | 'acronym' | 'accountType' | 'federalDepartment';
type SortDirection = 'asc' | 'desc';

// Sort icon component - defined outside to avoid recreating on each render
function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? (
    <ChevronUp className="h-4 w-4 inline ml-1" />
  ) : (
    <ChevronDown className="h-4 w-4 inline ml-1" />
  );
}

export function SalesOpsAccountsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch accounts
  const { data: accounts, isLoading, error } = useAccounts({
    search: searchQuery || undefined,
    accountType: typeFilter || undefined,
    includeInactive,
  });

  const deleteMutation = useDeleteAccount();

  // Sort accounts client-side
  const sortedAccounts = useMemo(() => {
    if (!accounts) return [];
    return [...accounts].sort((a, b) => {
      let aVal: string | null = null;
      let bVal: string | null = null;

      switch (sortField) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'acronym':
          aVal = a.acronym || '';
          bVal = b.acronym || '';
          break;
        case 'accountType':
          aVal = a.accountType || '';
          bVal = b.accountType || '';
          break;
        case 'federalDepartment':
          aVal = a.federalDepartment || '';
          bVal = b.federalDepartment || '';
          break;
      }

      const comparison = (aVal || '').localeCompare(bVal || '');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [accounts, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (account: SalesAccount) => {
    if (!confirm(`Are you sure you want to delete "${account.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(account.id);
      toast.success('Account deleted successfully');
    } catch {
      toast.error('Failed to delete account. It may have associated opportunities.');
    }
  };

  // Get unique account types for filter
  const accountTypes = useMemo(() => {
    if (!accounts) return [];
    const types = new Set(accounts.map((a) => a.accountType).filter(Boolean));
    return Array.from(types).sort();
  }, [accounts]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading accounts. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage government agencies and customer accounts
          </p>
        </div>
        <Link
          to="/salesops/accounts/new"
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Account
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="w-48">
            <label htmlFor="type-filter" className="sr-only">Account Type</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Types</option>
              {accountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Show inactive</span>
          </label>
        </div>
      </div>

      {/* Accounts Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading accounts...</p>
          </div>
        </div>
      ) : sortedAccounts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No accounts found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery || typeFilter
                ? 'Try adjusting your search or filters.'
                : 'Add government agencies and customer accounts to track your relationships.'}
            </p>
            {!searchQuery && !typeFilter && (
              <div className="mt-6">
                <Link
                  to="/salesops/accounts/new"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Account
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Account Name <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('acronym')}
                >
                  Acronym <SortIcon field="acronym" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('accountType')}
                >
                  Type <SortIcon field="accountType" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('federalDepartment')}
                >
                  Department <SortIcon field="federalDepartment" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAccounts.map((account) => (
                <tr
                  key={account.id}
                  className={`hover:bg-gray-50 cursor-pointer ${!account.isActive ? 'bg-gray-50 text-gray-500' : ''}`}
                  onClick={() => navigate(`/salesops/accounts/${account.id}`)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        {account.portfolio && (
                          <div className="text-xs text-gray-500">{account.portfolio}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {account.acronym || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {account.accountType && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {account.accountType}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {account.federalDepartment || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {account.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {account.website && (
                        <a
                          href={account.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="Visit website"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {account.phone && (
                        <a
                          href={`tel:${account.phone}`}
                          className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(account)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            {sortedAccounts.length} account{sortedAccounts.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesOpsAccountsPage;
