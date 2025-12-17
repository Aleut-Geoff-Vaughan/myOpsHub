import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';
import { useOpportunities, useStages, useAccounts } from '../../hooks/useSalesOps';
import {
  OpportunityType,
  OpportunityResult,
  type OpportunityListDto,
} from '../../services/salesOpsService';

type SortField = 'name' | 'accountName' | 'amount' | 'closeDate' | 'probabilityPercent' | 'stageName';
type SortDirection = 'asc' | 'desc';

const opportunityTypeLabels: Record<OpportunityType, string> = {
  [OpportunityType.NewBusiness]: 'New Business',
  [OpportunityType.Recompete]: 'Recompete',
  [OpportunityType.TaskOrder]: 'Task Order',
  [OpportunityType.Modification]: 'Modification',
  [OpportunityType.Option]: 'Option',
};

const opportunityResultLabels: Record<OpportunityResult, string> = {
  [OpportunityResult.Won]: 'Won',
  [OpportunityResult.Lost]: 'Lost',
  [OpportunityResult.NoBid]: 'No Bid',
  [OpportunityResult.Cancelled]: 'Cancelled',
  [OpportunityResult.Withdrawn]: 'Withdrawn',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function SalesOpsOpportunitiesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('closeDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Fetch data
  const { data: opportunitiesData, isLoading, error } = useOpportunities({
    search: searchQuery || undefined,
    stageId: stageFilter || undefined,
    accountId: accountFilter || undefined,
    result: resultFilter ? (Number(resultFilter) as OpportunityResult) : undefined,
    skip: page * pageSize,
    take: pageSize,
  });

  const { data: stages } = useStages();
  const { data: accounts } = useAccounts();

  const opportunities = opportunitiesData?.items || [];
  const totalCount = opportunitiesData?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Client-side sorting (API already sorted by closeDate)
  const sortedOpportunities = useMemo(() => {
    const sorted = [...opportunities];
    sorted.sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'accountName':
          aVal = (a.accountName || '').toLowerCase();
          bVal = (b.accountName || '').toLowerCase();
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'closeDate':
          aVal = new Date(a.closeDate).getTime();
          bVal = new Date(b.closeDate).getTime();
          break;
        case 'probabilityPercent':
          aVal = a.probabilityPercent;
          bVal = b.probabilityPercent;
          break;
        case 'stageName':
          aVal = a.stageName.toLowerCase();
          bVal = b.stageName.toLowerCase();
          break;
      }

      if (aVal === null || bVal === null) return 0;
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [opportunities, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStageFilter('');
    setAccountFilter('');
    setResultFilter('');
    setPage(0);
  };

  const hasActiveFilters = searchQuery || stageFilter || accountFilter || resultFilter;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const getResultBadgeClasses = (result?: OpportunityResult) => {
    switch (result) {
      case OpportunityResult.Won:
        return 'bg-emerald-100 text-emerald-800';
      case OpportunityResult.Lost:
        return 'bg-red-100 text-red-800';
      case OpportunityResult.NoBid:
        return 'bg-gray-100 text-gray-800';
      case OpportunityResult.Cancelled:
      case OpportunityResult.Withdrawn:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading opportunities. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your sales pipeline and track opportunities
          </p>
        </div>
        <Link
          to="/salesops/opportunities/new"
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Opportunity
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, account, or opportunity number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {[searchQuery, stageFilter, accountFilter, resultFilter].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-5 w-5 mr-2 text-gray-500" />
              Export
            </button>
          </div>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
            <div className="w-48">
              <label htmlFor="stage-filter" className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                id="stage-filter"
                value={stageFilter}
                onChange={(e) => {
                  setStageFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Stages</option>
                {stages?.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-48">
              <label htmlFor="account-filter" className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                id="account-filter"
                value={accountFilter}
                onChange={(e) => {
                  setAccountFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Accounts</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-48">
              <label htmlFor="result-filter" className="block text-sm font-medium text-gray-700 mb-1">Result</label>
              <select
                id="result-filter"
                value={resultFilter}
                onChange={(e) => {
                  setResultFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Open (No Result)</option>
                {Object.entries(opportunityResultLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {Math.min(page * pageSize + 1, totalCount)} -{' '}
          {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} opportunities
        </span>
      </div>

      {/* Table or Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading opportunities...</p>
        </div>
      ) : sortedOpportunities.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {hasActiveFilters ? 'No matching opportunities' : 'No opportunities yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query.'
                : 'Get started by creating your first sales opportunity.'}
            </p>
            {!hasActiveFilters && (
              <div className="mt-6">
                <Link
                  to="/salesops/opportunities/new"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Opportunity
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Opportunity <SortIcon field="name" />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('accountName')}
                  >
                    Account <SortIcon field="accountName" />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('stageName')}
                  >
                    Stage <SortIcon field="stageName" />
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    Amount <SortIcon field="amount" />
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('probabilityPercent')}
                  >
                    Prob. <SortIcon field="probabilityPercent" />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('closeDate')}
                  >
                    Close Date <SortIcon field="closeDate" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOpportunities.map((opp: OpportunityListDto) => (
                  <tr
                    key={opp.id}
                    onClick={() => navigate(`/salesops/opportunities/${opp.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{opp.name}</div>
                      <div className="text-xs text-gray-500">{opp.opportunityNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{opp.accountName || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: opp.stageColor ? `${opp.stageColor}20` : '#e5e7eb',
                          color: opp.stageColor || '#374151',
                        }}
                      >
                        {opp.stageName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(opp.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Wtd: {formatCurrency(opp.weightedAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">{opp.probabilityPercent}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(opp.closeDate)}</div>
                      {opp.closeFiscalYear && (
                        <div className="text-xs text-gray-500">{opp.closeFiscalYear}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{opp.ownerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultBadgeClasses(
                          opp.result
                        )}`}
                      >
                        {opp.result !== undefined && opp.result !== null
                          ? opportunityResultLabels[opp.result]
                          : opportunityTypeLabels[opp.type]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Page {page + 1} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SalesOpsOpportunitiesPage;
