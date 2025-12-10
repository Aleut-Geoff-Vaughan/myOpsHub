import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { facilitiesPortalService } from '../../services/facilitiesPortalService';
import type { OfficeDirectoryItem, OfficeTravelGuide } from '../../services/facilitiesPortalService';

export function TravelGuidesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);

  // Fetch offices with travel guides
  const { data: offices = [], isLoading: loadingOffices } = useQuery({
    queryKey: ['office-directory'],
    queryFn: () => facilitiesPortalService.getOfficeDirectory(),
  });

  // Fetch travel guide for selected office
  const { data: travelGuide, isLoading: loadingGuide } = useQuery({
    queryKey: ['travel-guide', selectedOfficeId],
    queryFn: () => facilitiesPortalService.getTravelGuide(selectedOfficeId!),
    enabled: !!selectedOfficeId,
  });

  // Filter offices with travel guides
  const officesWithGuides = offices.filter(o => o.hasTravelGuide);

  // Filter by search term
  const filteredOffices = officesWithGuides.filter(office => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      office.name.toLowerCase().includes(term) ||
      office.city?.toLowerCase().includes(term) ||
      office.stateCode?.toLowerCase().includes(term)
    );
  });

  const selectedOffice = offices.find(o => o.id === selectedOfficeId);

  if (loadingOffices) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Left Panel - Office List */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Travel Guides</h1>
            <p className="text-gray-600 mt-1">Find travel info for our offices</p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
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

          {/* Office List */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto">
            {filteredOffices.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No travel guides found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredOffices.map(office => (
                  <button
                    key={office.id}
                    onClick={() => setSelectedOfficeId(office.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition ${
                      selectedOfficeId === office.id ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        office.isClientSite ? 'bg-purple-100' : 'bg-teal-100'
                      }`}>
                        <svg className={`w-5 h-5 ${office.isClientSite ? 'text-purple-600' : 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{office.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {office.city}{office.stateCode && `, ${office.stateCode}`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Travel Guide Details */}
        <div className="flex-1 min-w-0">
          {!selectedOfficeId ? (
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
              <div className="text-center p-8">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Office</h3>
                <p className="text-gray-500">Choose an office from the list to view its travel guide</p>
              </div>
            </div>
          ) : loadingGuide ? (
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="space-y-3 mt-6">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ) : travelGuide ? (
            <TravelGuideContent office={selectedOffice!} guide={travelGuide} />
          ) : (
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
              <div className="text-center p-8">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Travel Guide Unavailable</h3>
                <p className="text-gray-500">The travel guide for this office could not be loaded</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TravelGuideContent({ office, guide }: { office: OfficeDirectoryItem; guide: OfficeTravelGuide }) {
  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{office.name}</h2>
            <p className="text-gray-600">
              {office.address && `${office.address}, `}
              {office.city}{office.stateCode && `, ${office.stateCode}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Print"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
            <Link
              to={`/facilities/offices/${office.id}`}
              className="px-3 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              View Office
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Description */}
        {guide.description && (
          <div>
            <p className="text-gray-700">{guide.description}</p>
          </div>
        )}

        {/* Getting There */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guide.directionsFromAirport && (
            <GuideSection
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
              title="From Airport"
              content={guide.directionsFromAirport}
            />
          )}

          {guide.directionsFromHighway && (
            <GuideSection
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
              title="From Highway"
              content={guide.directionsFromHighway}
            />
          )}

          {guide.publicTransitInfo && (
            <GuideSection
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              }
              title="Public Transit"
              content={guide.publicTransitInfo}
            />
          )}

          {guide.parkingInstructions && (
            <GuideSection
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              }
              title="Parking"
              content={guide.parkingInstructions}
            />
          )}
        </div>

        {/* Building Access */}
        {(guide.buildingAccessInfo || guide.securityCheckInProcedure) && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Building Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guide.buildingAccessInfo && (
                <GuideSection
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  title="Access Information"
                  content={guide.buildingAccessInfo}
                />
              )}
              {guide.securityCheckInProcedure && (
                <GuideSection
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  title="Security Check-In"
                  content={guide.securityCheckInProcedure}
                />
              )}
            </div>
          </div>
        )}

        {/* Lodging & Dining */}
        {(guide.nearbyHotels || guide.nearbyRestaurants) && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Lodging & Dining
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guide.nearbyHotels && (
                <GuideSection
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  title="Nearby Hotels"
                  content={guide.nearbyHotels}
                />
              )}
              {guide.nearbyRestaurants && (
                <GuideSection
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  }
                  title="Nearby Restaurants"
                  content={guide.nearbyRestaurants}
                />
              )}
            </div>
          </div>
        )}

        {/* Local Amenities */}
        {guide.nearbyAmenities && (
          <div className="border-t border-gray-200 pt-6">
            <GuideSection
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="Local Amenities"
              content={guide.nearbyAmenities}
            />
          </div>
        )}

        {/* Emergency Information */}
        {(guide.emergencyInfo || guide.localEmergencyNumbers) && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Emergency Information
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.emergencyInfo && (
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Emergency Procedures</h4>
                    <p className="text-red-700 whitespace-pre-wrap">{guide.emergencyInfo}</p>
                  </div>
                )}
                {guide.localEmergencyNumbers && (
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Emergency Numbers</h4>
                    <p className="text-red-700 whitespace-pre-wrap">{guide.localEmergencyNumbers}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {guide.lastUpdated && (
          <div className="border-t border-gray-200 pt-4 text-sm text-gray-500">
            Last updated: {new Date(guide.lastUpdated).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

function GuideSection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-teal-600">{icon}</span>
        {title}
      </h4>
      <p className="text-gray-700 whitespace-pre-wrap text-sm">{content}</p>
    </div>
  );
}
