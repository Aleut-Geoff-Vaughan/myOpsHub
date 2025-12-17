import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, ChevronUp, ChevronDown, Building2, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useContractVehicles, useDeleteContractVehicle } from '../../hooks/useSalesOps';
import { type ContractVehicle } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

type SortField = 'name' | 'contractNumber' | 'vehicleType' | 'expirationDate';
type SortDirection = 'asc' | 'desc';

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

// Check if expiring soon (within 90 days)
function isExpiringSoon(dateString: string | undefined | null): boolean {
  if (!dateString) return false;
  const expirationDate = new Date(dateString);
  const today = new Date();
  const daysUntilExpiration = (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiration > 0 && daysUntilExpiration <= 90;
}

// Check if expired
function isExpired(dateString: string | undefined | null): boolean {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

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

export function SalesOpsVehiclesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch contract vehicles
  const { data: vehicles, isLoading, error } = useContractVehicles({
    search: searchQuery || undefined,
    vehicleType: typeFilter || undefined,
    includeInactive,
  });

  // Delete mutation
  const deleteVehicle = useDeleteContractVehicle();

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    if (!vehicles) return [];
    return [...vehicles].sort((a, b) => {
      let aVal = '';
      let bVal = '';

      switch (sortField) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'contractNumber':
          aVal = a.contractNumber || '';
          bVal = b.contractNumber || '';
          break;
        case 'vehicleType':
          aVal = a.vehicleType || '';
          bVal = b.vehicleType || '';
          break;
        case 'expirationDate':
          aVal = a.expirationDate || '';
          bVal = b.expirationDate || '';
          break;
      }

      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [vehicles, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (vehicle: ContractVehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete contract vehicle "${vehicle.name}"?`)) {
      return;
    }
    try {
      await deleteVehicle.mutateAsync(vehicle.id);
      toast.success('Contract vehicle deleted');
    } catch {
      toast.error('Failed to delete contract vehicle');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!vehicles) return { total: 0, active: 0, expiringSoon: 0, totalCeiling: 0 };
    return {
      total: vehicles.length,
      active: vehicles.filter(v => v.isActive).length,
      expiringSoon: vehicles.filter(v => isExpiringSoon(v.expirationDate)).length,
      totalCeiling: vehicles.reduce((sum, v) => sum + (v.ceilingValue || 0), 0),
    };
  }, [vehicles]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load contract vehicles: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Vehicles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage IDIQ contracts, GWACs, GSA schedules, and other vehicles
          </p>
        </div>
        <Link
          to="/salesops/vehicles/new"
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Vehicle
        </Link>
      </div>

      {/* Stats Cards */}
      {!isLoading && vehicles && vehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Vehicles</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Expiring Soon</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Ceiling</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalCeiling)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by vehicle type"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">All Types</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Include Inactive */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Include inactive</span>
          </label>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading contract vehicles...</p>
          </div>
        ) : sortedVehicles.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No contract vehicles yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Add contract vehicles to track IDIQ, GWAC, and other agreements.
            </p>
            <div className="mt-6">
              <Link
                to="/salesops/vehicles/new"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Contract Vehicle
              </Link>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('contractNumber')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Contract #</span>
                    <SortIcon field="contractNumber" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('vehicleType')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    <SortIcon field="vehicleType" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issuing Agency
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ceiling
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('expirationDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Expiration</span>
                    <SortIcon field="expirationDate" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/salesops/vehicles/${vehicle.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.name}
                          {!vehicle.isActive && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        {vehicle.biddingEntity && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {vehicle.biddingEntity.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vehicle.contractNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {vehicle.vehicleType ? (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {vehicle.vehicleType}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vehicle.issuingAgency || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {vehicle.ceilingValue ? (
                      <div className="flex items-center justify-end text-gray-900">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        {formatCurrency(vehicle.ceilingValue).replace('$', '')}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {vehicle.expirationDate ? (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span
                          className={`text-sm ${
                            isExpired(vehicle.expirationDate)
                              ? 'text-red-600 font-medium'
                              : isExpiringSoon(vehicle.expirationDate)
                              ? 'text-yellow-600 font-medium'
                              : 'text-gray-900'
                          }`}
                        >
                          {formatDate(vehicle.expirationDate)}
                          {isExpired(vehicle.expirationDate) && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                              Expired
                            </span>
                          )}
                          {isExpiringSoon(vehicle.expirationDate) && !isExpired(vehicle.expirationDate) && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                              Soon
                            </span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(vehicle, e)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete contract vehicle"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!isLoading && sortedVehicles.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {sortedVehicles.length} contract vehicle{sortedVehicles.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default SalesOpsVehiclesPage;
