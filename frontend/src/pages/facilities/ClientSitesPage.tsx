import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { facilitiesPortalService, SecurityClearanceLevel } from '../../services/facilitiesPortalService';
import type { ClientSiteDetail } from '../../services/facilitiesPortalService';

function getClearanceLabel(level: SecurityClearanceLevel): string {
  switch (level) {
    case SecurityClearanceLevel.None: return 'None';
    case SecurityClearanceLevel.PublicTrust: return 'Public Trust';
    case SecurityClearanceLevel.Secret: return 'Secret';
    case SecurityClearanceLevel.TopSecret: return 'Top Secret';
    case SecurityClearanceLevel.TopSecretSci: return 'TS/SCI';
    default: return 'Unknown';
  }
}

function getClearanceColor(level: SecurityClearanceLevel): string {
  switch (level) {
    case SecurityClearanceLevel.None: return 'bg-gray-100 text-gray-800';
    case SecurityClearanceLevel.PublicTrust: return 'bg-blue-100 text-blue-800';
    case SecurityClearanceLevel.Secret: return 'bg-yellow-100 text-yellow-800';
    case SecurityClearanceLevel.TopSecret: return 'bg-orange-100 text-orange-800';
    case SecurityClearanceLevel.TopSecretSci: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function ClientSitesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clearanceFilter, setClearanceFilter] = useState<SecurityClearanceLevel | 'all'>('all');
  const [scifFilter, setScifFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedSite, setSelectedSite] = useState<ClientSiteDetail | null>(null);

  const { data: clientSites = [], isLoading } = useQuery({
    queryKey: ['client-sites'],
    queryFn: () => facilitiesPortalService.getClientSites(),
  });

  // Filter sites
  const filteredSites = clientSites.filter(site => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        site.clientCompanyName?.toLowerCase().includes(query) ||
        site.contractNumber?.toLowerCase().includes(query) ||
        site.primaryCustomerPoc?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Clearance filter
    if (clearanceFilter !== 'all' && site.requiredClearance !== clearanceFilter) {
      return false;
    }

    // SCIF filter
    if (scifFilter === 'yes' && !site.hasScif) return false;
    if (scifFilter === 'no' && site.hasScif) return false;

    return true;
  });

  // Summary stats
  const scifSites = clientSites.filter(s => s.hasScif).length;
  const highClearanceSites = clientSites.filter(s =>
    s.requiredClearance === SecurityClearanceLevel.TopSecret ||
    s.requiredClearance === SecurityClearanceLevel.TopSecretSci
  ).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Sites</h1>
          <p className="text-gray-600 mt-1">View and manage client site information</p>
        </div>
        <Link
          to="/facilities/field-assignments"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          View Assignments
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sites</p>
              <p className="text-2xl font-bold text-gray-900">{clientSites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">SCIF Facilities</p>
              <p className="text-2xl font-bold text-gray-900">{scifSites}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">TS/TS-SCI Sites</p>
              <p className="text-2xl font-bold text-gray-900">{highClearanceSites}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by company, contract, or POC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Clearance Filter */}
          <select
            value={clearanceFilter}
            onChange={(e) => setClearanceFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as SecurityClearanceLevel)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Filter by clearance"
          >
            <option value="all">All Clearances</option>
            <option value={SecurityClearanceLevel.None}>None</option>
            <option value={SecurityClearanceLevel.PublicTrust}>Public Trust</option>
            <option value={SecurityClearanceLevel.Secret}>Secret</option>
            <option value={SecurityClearanceLevel.TopSecret}>Top Secret</option>
            <option value={SecurityClearanceLevel.TopSecretSci}>TS/SCI</option>
          </select>

          {/* SCIF Filter */}
          <select
            value={scifFilter}
            onChange={(e) => setScifFilter(e.target.value as 'all' | 'yes' | 'no')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Filter by SCIF"
          >
            <option value="all">All Sites</option>
            <option value="yes">SCIF Only</option>
            <option value="no">Non-SCIF Only</option>
          </select>
        </div>
      </div>

      {/* Sites Grid */}
      {filteredSites.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-lg font-medium text-gray-900">No client sites found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedSite(site)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{site.clientCompanyName}</h3>
                    {site.contractNumber && (
                      <p className="text-sm text-gray-500">Contract: {site.contractNumber}</p>
                    )}
                  </div>
                  {site.hasScif && (
                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      SCIF
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Required Clearance */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Required Clearance</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getClearanceColor(site.requiredClearance)}`}>
                      {getClearanceLabel(site.requiredClearance)}
                    </span>
                  </div>

                  {/* Primary POC */}
                  {site.primaryCustomerPoc && (
                    <div>
                      <p className="text-sm text-gray-500">Primary Contact</p>
                      <p className="text-sm font-medium text-gray-900">{site.primaryCustomerPoc}</p>
                    </div>
                  )}

                  {/* Security POC */}
                  {site.securityPocName && (
                    <div>
                      <p className="text-sm text-gray-500">Security Contact</p>
                      <p className="text-sm font-medium text-gray-900">{site.securityPocName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                  View Details
                </button>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedSite(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedSite.clientCompanyName}</h2>
                {selectedSite.contractNumber && (
                  <p className="text-sm text-gray-500">Contract: {selectedSite.contractNumber}</p>
                )}
              </div>
              <button onClick={() => setSelectedSite(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Security Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Security Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Required Clearance</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getClearanceColor(selectedSite.requiredClearance)}`}>
                      {getClearanceLabel(selectedSite.requiredClearance)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">SCIF Access</p>
                    <p className="font-medium text-gray-900">{selectedSite.hasScif ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                {selectedSite.hasScif && selectedSite.scifLocation && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">SCIF Location</p>
                    <p className="text-gray-900">{selectedSite.scifLocation}</p>
                  </div>
                )}
              </div>

              {/* Customer Contact */}
              {(selectedSite.primaryCustomerPoc || selectedSite.customerPocEmail || selectedSite.customerPocPhone) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Customer Contact</h3>
                  <div className="space-y-2">
                    {selectedSite.primaryCustomerPoc && (
                      <p className="text-gray-900 font-medium">{selectedSite.primaryCustomerPoc}</p>
                    )}
                    {selectedSite.customerPocEmail && (
                      <p className="text-sm text-gray-600">
                        <a href={`mailto:${selectedSite.customerPocEmail}`} className="text-teal-600 hover:text-teal-700">
                          {selectedSite.customerPocEmail}
                        </a>
                      </p>
                    )}
                    {selectedSite.customerPocPhone && (
                      <p className="text-sm text-gray-600">
                        <a href={`tel:${selectedSite.customerPocPhone}`} className="text-teal-600 hover:text-teal-700">
                          {selectedSite.customerPocPhone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Security Contact */}
              {(selectedSite.securityPocName || selectedSite.securityPocEmail || selectedSite.securityPocPhone) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Security Contact</h3>
                  <div className="space-y-2">
                    {selectedSite.securityPocName && (
                      <p className="text-gray-900 font-medium">{selectedSite.securityPocName}</p>
                    )}
                    {selectedSite.securityPocEmail && (
                      <p className="text-sm text-gray-600">
                        <a href={`mailto:${selectedSite.securityPocEmail}`} className="text-teal-600 hover:text-teal-700">
                          {selectedSite.securityPocEmail}
                        </a>
                      </p>
                    )}
                    {selectedSite.securityPocPhone && (
                      <p className="text-sm text-gray-600">
                        <a href={`tel:${selectedSite.securityPocPhone}`} className="text-teal-600 hover:text-teal-700">
                          {selectedSite.securityPocPhone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Access Procedures */}
              {(selectedSite.accessProcedure || selectedSite.badgeProcess) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Access Procedures</h3>
                  {selectedSite.accessProcedure && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Building Access</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedSite.accessProcedure}</p>
                    </div>
                  )}
                  {selectedSite.badgeProcess && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Badge Process</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedSite.badgeProcess}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SCIF Access Procedure */}
              {selectedSite.hasScif && selectedSite.scifAccessProcedure && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">SCIF Access Procedure</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSite.scifAccessProcedure}</p>
                </div>
              )}

              {/* Special Requirements */}
              {selectedSite.specialRequirements && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Special Requirements</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSite.specialRequirements}</p>
                </div>
              )}

              {/* Emergency Procedures */}
              {selectedSite.emergencyProcedures && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2">Emergency Procedures</h3>
                  <p className="text-red-800 whitespace-pre-wrap">{selectedSite.emergencyProcedures}</p>
                </div>
              )}

              {/* Notes */}
              {selectedSite.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSite.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
