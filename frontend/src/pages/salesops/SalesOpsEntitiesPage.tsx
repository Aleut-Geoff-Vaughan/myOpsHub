import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Edit2,
  Filter,
} from 'lucide-react';
import { useBiddingEntities, useExpiringBiddingEntities } from '../../hooks/useSalesOps';
import { format } from 'date-fns';

// Badge component for certifications
function CertBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
      {label}
    </span>
  );
}

// SBA Status indicator
function SbaStatusBadge({
  is8a,
  expirationDate,
  daysUntil,
}: {
  is8a: boolean;
  expirationDate?: string;
  daysUntil?: number;
}) {
  if (!is8a) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Not 8(a)
      </span>
    );
  }

  if (!expirationDate) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <CheckCircle2 className="h-3 w-3" />
        8(a) Active
      </span>
    );
  }

  if (daysUntil !== undefined && daysUntil !== null) {
    if (daysUntil < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3" />
          Expired
        </span>
      );
    }
    if (daysUntil <= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <Clock className="h-3 w-3" />
          {daysUntil}d left
        </span>
      );
    }
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckCircle2 className="h-3 w-3" />
      8(a) Active
    </span>
  );
}

export function SalesOpsEntitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter8a, setFilter8a] = useState<'all' | '8a' | 'non8a'>('all');
  const [showInactive, setShowInactive] = useState(false);

  // Fetch data
  const { data: entities, isLoading, error } = useBiddingEntities({
    includeInactive: showInactive,
    is8a: filter8a === '8a' ? true : filter8a === 'non8a' ? false : undefined,
  });
  const { data: expiringEntities } = useExpiringBiddingEntities(90);

  // Filter entities by search
  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    if (!searchQuery.trim()) return entities;

    const query = searchQuery.toLowerCase();
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.legalName?.toLowerCase().includes(query) ||
        e.cageCode?.toLowerCase().includes(query) ||
        e.ueiNumber?.toLowerCase().includes(query)
    );
  }, [entities, searchQuery]);

  // Summary stats
  const stats = useMemo(() => {
    if (!entities) return { total: 0, active8a: 0, expiringSoon: 0, smallBusiness: 0 };
    return {
      total: entities.length,
      active8a: entities.filter((e) => e.is8a && e.isSbaActive).length,
      expiringSoon: expiringEntities?.length || 0,
      smallBusiness: entities.filter((e) => e.isSmallBusiness).length,
    };
  }, [entities, expiringEntities]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Failed to load bidding entities. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bidding Entities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track 8(a) certifications and teaming partners
          </p>
        </div>
        <Link
          to="/salesops/entities/new"
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Entity
        </Link>
      </div>

      {/* SBA Expiration Alert */}
      {expiringEntities && expiringEntities.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">
                8(a) Certifications Expiring Soon
              </h3>
              <div className="mt-2 space-y-1">
                {expiringEntities.slice(0, 3).map((entity) => (
                  <div key={entity.id} className="flex items-center justify-between text-sm">
                    <Link
                      to={`/salesops/entities/${entity.id}`}
                      className="text-amber-700 hover:text-amber-900 font-medium"
                    >
                      {entity.name}
                    </Link>
                    <span className="text-amber-600">
                      {entity.daysUntilSbaExpiration !== undefined && entity.daysUntilSbaExpiration !== null
                        ? entity.daysUntilSbaExpiration < 0
                          ? 'Expired'
                          : `${entity.daysUntilSbaExpiration} days remaining`
                        : 'Unknown'}
                    </span>
                  </div>
                ))}
                {expiringEntities.length > 3 && (
                  <p className="text-xs text-amber-600 mt-1">
                    +{expiringEntities.length - 3} more expiring within 90 days
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Total Entities</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-500">Active 8(a)</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-green-600">{stats.active8a}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-gray-500">Expiring Soon</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.expiringSoon}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-500">Small Business</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.smallBusiness}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, CAGE code, or UEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <label htmlFor="filter-8a" className="sr-only">Filter by 8(a) status</label>
              <select
                id="filter-8a"
                value={filter8a}
                onChange={(e) => setFilter8a(e.target.value as 'all' | '8a' | 'non8a')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Entities</option>
                <option value="8a">8(a) Only</option>
                <option value="non8a">Non-8(a)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              Show Inactive
            </label>
          </div>
        </div>
      </div>

      {/* Entity List */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      ) : filteredEntities.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {entities?.length === 0 ? 'No bidding entities yet' : 'No matches found'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              {entities?.length === 0
                ? 'Add your company and teaming partners to track certifications and assign them to opportunities.'
                : 'Try adjusting your search or filters.'}
            </p>
            {entities?.length === 0 && (
              <div className="mt-6 space-y-2">
                <Link
                  to="/salesops/entities/new"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Bidding Entity
                </Link>
                <p className="text-xs text-gray-500">
                  Common certifications: 8(a), SDVOSB, WOSB, HUBZone
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Identifiers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  8(a) Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certifications
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntities.map((entity) => (
                <tr key={entity.id} className={!entity.isActive ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <Link
                        to={`/salesops/entities/${entity.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-orange-600"
                      >
                        {entity.name}
                      </Link>
                      {entity.legalName && entity.legalName !== entity.name && (
                        <p className="text-xs text-gray-500">{entity.legalName}</p>
                      )}
                      {!entity.isActive && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-1">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {entity.cageCode && (
                        <span className="mr-3">
                          <span className="text-gray-500">CAGE:</span> {entity.cageCode}
                        </span>
                      )}
                      {entity.ueiNumber && (
                        <span>
                          <span className="text-gray-500">UEI:</span> {entity.ueiNumber}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <SbaStatusBadge
                        is8a={entity.is8a}
                        expirationDate={entity.sbaExpirationDate}
                        daysUntil={entity.daysUntilSbaExpiration}
                      />
                      {entity.is8a && entity.sbaExpirationDate && (
                        <span className="text-xs text-gray-500">
                          Expires: {format(new Date(entity.sbaExpirationDate), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      <CertBadge label="SB" active={entity.isSmallBusiness} />
                      <CertBadge label="SDVOSB" active={entity.isSDVOSB} />
                      <CertBadge label="VOSB" active={entity.isVOSB} />
                      <CertBadge label="WOSB" active={entity.isWOSB} />
                      <CertBadge label="EDWOSB" active={entity.isEDWOSB} />
                      <CertBadge label="HUBZone" active={entity.isHUBZone} />
                      <CertBadge label="SDB" active={entity.isSDB} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/salesops/entities/${entity.id}`}
                        className="text-gray-400 hover:text-gray-600"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/salesops/entities/${entity.id}/edit`}
                        className="text-gray-400 hover:text-orange-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SalesOpsEntitiesPage;
