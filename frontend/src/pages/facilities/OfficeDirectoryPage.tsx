import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { facilitiesPortalService } from '../../services/facilitiesPortalService';
import type { OfficeDirectoryItem } from '../../services/facilitiesPortalService';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'company' | 'client';

export function OfficeDirectoryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('');

  const { data: offices = [], isLoading, error } = useQuery({
    queryKey: ['office-directory'],
    queryFn: () => facilitiesPortalService.getOfficeDirectory(),
  });

  // Get unique states for filter
  const uniqueStates = [...new Set(offices.map(o => o.stateCode).filter(Boolean))].sort();

  // Filter offices
  const filteredOffices = offices.filter(office => {
    // Type filter
    if (filterType === 'company' && office.isClientSite) return false;
    if (filterType === 'client' && !office.isClientSite) return false;

    // State filter
    if (selectedState && office.stateCode !== selectedState) return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = office.name.toLowerCase().includes(term);
      const matchCity = office.city?.toLowerCase().includes(term);
      const matchState = office.stateCode?.toLowerCase().includes(term);
      const matchAddress = office.address?.toLowerCase().includes(term);
      if (!matchName && !matchCity && !matchState && !matchAddress) return false;
    }

    return true;
  });

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
      case 2: return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Planned</span>;
      case 3: return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Closed</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading office directory. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Office Directory</h1>
          <p className="text-gray-600 mt-1">Find offices and client sites across our organization</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Grid view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="List view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search offices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Type:</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-2 text-sm font-medium ${filterType === 'all' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('company')}
                className={`px-3 py-2 text-sm font-medium border-l ${filterType === 'company' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Company
              </button>
              <button
                onClick={() => setFilterType('client')}
                className={`px-3 py-2 text-sm font-medium border-l ${filterType === 'client' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Client Sites
              </button>
            </div>
          </div>

          {/* State Filter */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredOffices.length} of {offices.length} offices
      </div>

      {/* Office Grid/List */}
      {filteredOffices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No offices found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffices.map((office) => (
            <OfficeCard key={office.id} office={office} getStatusBadge={getStatusBadge} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spaces</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOffices.map((office) => (
                <OfficeRow key={office.id} office={office} getStatusBadge={getStatusBadge} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OfficeCard({ office, getStatusBadge }: { office: OfficeDirectoryItem; getStatusBadge: (status: number) => React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header with gradient */}
      <div className={`h-24 ${office.isClientSite ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-teal-500 to-teal-600'} relative`}>
        <div className="absolute top-3 left-3">
          {office.isClientSite ? (
            <span className="px-2 py-1 text-xs font-medium bg-white/20 text-white rounded-full backdrop-blur-sm">Client Site</span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-white/20 text-white rounded-full backdrop-blur-sm">Company Office</span>
          )}
        </div>
        <div className="absolute bottom-3 right-3">
          {getStatusBadge(office.status)}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{office.name}</h3>

        <div className="space-y-2 text-sm text-gray-600">
          {office.address && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                {office.address}
                {office.city && `, ${office.city}`}
                {office.stateCode && ` ${office.stateCode}`}
              </span>
            </div>
          )}

          {office.timezone && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{office.timezone}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{office.spaceCount} spaces</span>
          </div>
          {office.hasTravelGuide && (
            <div className="flex items-center gap-1 text-sm text-teal-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Travel Guide</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link
            to={`/facilities/offices/${office.id}`}
            className="flex-1 px-3 py-2 text-sm font-medium text-center bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            View Details
          </Link>
          <Link
            to={`/facilities/check-in?office=${office.id}`}
            className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            title="Check In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
          <Link
            to={`/facilities/whos-here?office=${office.id}`}
            className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            title="Who's Here"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function OfficeRow({ office, getStatusBadge }: { office: OfficeDirectoryItem; getStatusBadge: (status: number) => React.ReactNode }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${office.isClientSite ? 'bg-purple-100' : 'bg-teal-100'}`}>
            <svg className={`w-5 h-5 ${office.isClientSite ? 'text-purple-600' : 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{office.name}</div>
            {office.hasTravelGuide && (
              <div className="text-xs text-teal-600">Travel Guide Available</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{office.city || '-'}</div>
        <div className="text-sm text-gray-500">{office.stateCode || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {office.isClientSite ? (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Client Site</span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">Company</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {office.spaceCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(office.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center gap-2">
          <Link
            to={`/facilities/offices/${office.id}`}
            className="text-teal-600 hover:text-teal-800 font-medium"
          >
            View
          </Link>
          <Link
            to={`/facilities/check-in?office=${office.id}`}
            className="text-gray-600 hover:text-gray-800"
            title="Check In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
        </div>
      </td>
    </tr>
  );
}
