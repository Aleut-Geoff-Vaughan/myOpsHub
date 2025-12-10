import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { facilitiesPortalService, OfficePocRole } from '../../services/facilitiesPortalService';
import type { OfficePoc, OfficeTravelGuide, FacilityAnnouncement } from '../../services/facilitiesPortalService';
import { bookingsService } from '../../services/bookingsService';
import { SpaceType } from '../../types/api';
import type { Space } from '../../types/api';
import { format } from 'date-fns';

type TabType = 'overview' | 'travel' | 'spaces' | 'announcements';

export function OfficeDetailPage() {
  const { officeId } = useParams<{ officeId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Fetch office details
  const { data: officeDetails, isLoading, error } = useQuery({
    queryKey: ['office-details', officeId],
    queryFn: () => facilitiesPortalService.getOfficeDetails(officeId!),
    enabled: !!officeId,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded-lg mt-6"></div>
        </div>
      </div>
    );
  }

  if (error || !officeDetails) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Office Not Found</h3>
          <p className="text-red-600 mb-4">The requested office could not be loaded.</p>
          <Link to="/facilities/offices" className="text-teal-600 hover:text-teal-800 font-medium">
            Back to Office Directory
          </Link>
        </div>
      </div>
    );
  }

  const { office, travelGuide, pointsOfContact, activeAnnouncements } = officeDetails;

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', count: pointsOfContact.length },
    { id: 'travel' as TabType, label: 'Travel Guide', count: travelGuide ? 1 : 0 },
    { id: 'spaces' as TabType, label: 'Spaces', count: 0 },
    { id: 'announcements' as TabType, label: 'Announcements', count: activeAnnouncements.length },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <Link
                to="/facilities/offices"
                className="inline-flex items-center gap-1 text-teal-100 hover:text-white text-sm mb-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Directory
              </Link>
              <h1 className="text-2xl font-bold text-white">{office.name}</h1>
              <p className="text-teal-100 mt-1">{office.address}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/facilities/check-in?office=${officeId}`}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition backdrop-blur-sm"
              >
                Check In
              </Link>
              <Link
                to={`/facilities/whos-here?office=${officeId}`}
                className="px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition"
              >
                Who's Here
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab pointsOfContact={pointsOfContact} />
          )}
          {activeTab === 'travel' && (
            <TravelTab travelGuide={travelGuide} />
          )}
          {activeTab === 'spaces' && (
            <SpacesTab officeId={officeId!} />
          )}
          {activeTab === 'announcements' && (
            <AnnouncementsTab announcements={activeAnnouncements} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ pointsOfContact }: { pointsOfContact: OfficePoc[] }) {
  const getRoleName = (role: OfficePocRole) => {
    const names: Record<OfficePocRole, string> = {
      [OfficePocRole.BuildingManager]: 'Building Manager',
      [OfficePocRole.SecurityDesk]: 'Security Desk',
      [OfficePocRole.ITSupport]: 'IT Support',
      [OfficePocRole.Maintenance]: 'Maintenance',
      [OfficePocRole.Receptionist]: 'Receptionist',
      [OfficePocRole.OfficeManager]: 'Office Manager',
      [OfficePocRole.FSO]: 'FSO',
      [OfficePocRole.EmergencyContact]: 'Emergency Contact',
      [OfficePocRole.Other]: 'Other',
    };
    return names[role] || 'Unknown';
  };

  if (pointsOfContact.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Contacts Added</h3>
        <p className="text-gray-500">Points of contact have not been set up for this office yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Points of Contact</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pointsOfContact.map((poc) => (
          <div key={poc.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{poc.name}</p>
                  {poc.isPrimary && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded-full">Primary</span>
                  )}
                </div>
                <p className="text-sm text-teal-600">{getRoleName(poc.role)}</p>
                {poc.title && <p className="text-sm text-gray-500">{poc.title}</p>}
                {poc.email && (
                  <a href={`mailto:${poc.email}`} className="text-sm text-gray-600 hover:text-teal-600 block mt-1">
                    {poc.email}
                  </a>
                )}
                {poc.phone && (
                  <a href={`tel:${poc.phone}`} className="text-sm text-gray-600 hover:text-teal-600 block">
                    {poc.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TravelTab({ travelGuide }: { travelGuide?: OfficeTravelGuide }) {
  if (!travelGuide) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Travel Guide</h3>
        <p className="text-gray-500">A travel guide has not been created for this office yet.</p>
      </div>
    );
  }

  const sections = [
    { title: 'Description', content: travelGuide.description, icon: '📝' },
    { title: 'From Airport', content: travelGuide.directionsFromAirport, icon: '✈️' },
    { title: 'From Highway', content: travelGuide.directionsFromHighway, icon: '🛣️' },
    { title: 'Public Transit', content: travelGuide.publicTransitInfo, icon: '🚇' },
    { title: 'Parking', content: travelGuide.parkingInstructions, icon: '🅿️' },
    { title: 'Building Access', content: travelGuide.buildingAccessInfo, icon: '🏢' },
    { title: 'Security Check-In', content: travelGuide.securityCheckInProcedure, icon: '🔐' },
    { title: 'Nearby Hotels', content: travelGuide.nearbyHotels, icon: '🏨' },
    { title: 'Nearby Restaurants', content: travelGuide.nearbyRestaurants, icon: '🍽️' },
    { title: 'Local Amenities', content: travelGuide.nearbyAmenities, icon: '🏪' },
  ].filter(s => s.content);

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div key={idx} className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <span>{section.icon}</span>
            {section.title}
          </h4>
          <p className="text-gray-700 whitespace-pre-wrap text-sm">{section.content}</p>
        </div>
      ))}

      {(travelGuide.emergencyInfo || travelGuide.localEmergencyNumbers) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
            <span>🚨</span>
            Emergency Information
          </h4>
          {travelGuide.emergencyInfo && (
            <p className="text-red-700 whitespace-pre-wrap text-sm mb-2">{travelGuide.emergencyInfo}</p>
          )}
          {travelGuide.localEmergencyNumbers && (
            <p className="text-red-700 whitespace-pre-wrap text-sm">{travelGuide.localEmergencyNumbers}</p>
          )}
        </div>
      )}

      {travelGuide.lastUpdated && (
        <p className="text-sm text-gray-500">
          Last updated: {format(new Date(travelGuide.lastUpdated), 'MMMM d, yyyy')}
        </p>
      )}
    </div>
  );
}

function SpacesTab({ officeId }: { officeId: string }) {
  const [filterType, setFilterType] = useState<SpaceType | 'all'>('all');

  const { data: spaces, isLoading, error } = useQuery({
    queryKey: ['office-spaces', officeId],
    queryFn: () => bookingsService.getSpaces({ officeId }),
    enabled: !!officeId,
  });

  const getSpaceTypeName = (type: SpaceType): string => {
    const names: Record<SpaceType, string> = {
      [SpaceType.Desk]: 'Desk',
      [SpaceType.HotDesk]: 'Hot Desk',
      [SpaceType.Office]: 'Office',
      [SpaceType.Cubicle]: 'Cubicle',
      [SpaceType.Room]: 'Room',
      [SpaceType.ConferenceRoom]: 'Conference Room',
      [SpaceType.HuddleRoom]: 'Huddle Room',
      [SpaceType.PhoneBooth]: 'Phone Booth',
      [SpaceType.TrainingRoom]: 'Training Room',
      [SpaceType.BreakRoom]: 'Break Room',
      [SpaceType.ParkingSpot]: 'Parking Spot',
    };
    return names[type] || 'Unknown';
  };

  const getSpaceTypeIcon = (type: SpaceType): string => {
    const icons: Record<SpaceType, string> = {
      [SpaceType.Desk]: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
      [SpaceType.HotDesk]: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
      [SpaceType.Office]: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      [SpaceType.Cubicle]: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
      [SpaceType.Room]: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      [SpaceType.ConferenceRoom]: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      [SpaceType.HuddleRoom]: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      [SpaceType.PhoneBooth]: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
      [SpaceType.TrainingRoom]: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      [SpaceType.BreakRoom]: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
      [SpaceType.ParkingSpot]: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
    };
    return icons[type] || 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z';
  };

  const getSpaceTypeColor = (type: SpaceType): string => {
    const colors: Record<SpaceType, string> = {
      [SpaceType.Desk]: 'bg-blue-100 text-blue-600',
      [SpaceType.HotDesk]: 'bg-orange-100 text-orange-600',
      [SpaceType.Office]: 'bg-purple-100 text-purple-600',
      [SpaceType.Cubicle]: 'bg-gray-100 text-gray-600',
      [SpaceType.Room]: 'bg-green-100 text-green-600',
      [SpaceType.ConferenceRoom]: 'bg-teal-100 text-teal-600',
      [SpaceType.HuddleRoom]: 'bg-cyan-100 text-cyan-600',
      [SpaceType.PhoneBooth]: 'bg-indigo-100 text-indigo-600',
      [SpaceType.TrainingRoom]: 'bg-yellow-100 text-yellow-600',
      [SpaceType.BreakRoom]: 'bg-pink-100 text-pink-600',
      [SpaceType.ParkingSpot]: 'bg-slate-100 text-slate-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Spaces</h3>
        <p className="text-gray-500">Unable to fetch spaces for this office.</p>
      </div>
    );
  }

  if (!spaces || spaces.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Spaces Available</h3>
        <p className="text-gray-500">This office does not have any spaces configured yet.</p>
      </div>
    );
  }

  // Get unique space types for filtering
  const spaceTypes = Array.from(new Set(spaces.map(s => s.type))).sort((a, b) => a - b);

  // Filter spaces
  const filteredSpaces = filterType === 'all'
    ? spaces
    : spaces.filter(s => s.type === filterType);

  // Group spaces by type
  const spacesByType = filteredSpaces.reduce((acc, space) => {
    const typeName = getSpaceTypeName(space.type);
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(space);
    return acc;
  }, {} as Record<string, Space[]>);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">Filter by type:</span>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 text-sm rounded-full transition ${
            filterType === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({spaces.length})
        </button>
        {spaceTypes.map((type) => {
          const count = spaces.filter(s => s.type === type).length;
          return (
            <button
              type="button"
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-sm rounded-full transition ${
                filterType === type
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getSpaceTypeName(type)} ({count})
            </button>
          );
        })}
      </div>

      {/* Spaces Grid */}
      {Object.entries(spacesByType).map(([typeName, typeSpaces]) => (
        <div key={typeName}>
          <h4 className="text-md font-semibold text-gray-800 mb-3">{typeName}s ({typeSpaces.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeSpaces.map((space) => (
              <div
                key={space.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition ${
                  !space.isAvailable ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getSpaceTypeColor(space.type)}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getSpaceTypeIcon(space.type)} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-900 truncate">{space.name}</h5>
                      {!space.isAvailable && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Unavailable</span>
                      )}
                      {space.requiresApproval && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Approval Required</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{getSpaceTypeName(space.type)}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {space.capacity}
                      </span>
                      {space.dailyCost !== undefined && space.dailyCost > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ${space.dailyCost}/day
                        </span>
                      )}
                    </div>
                    {space.features && (
                      <p className="text-xs text-gray-500 mt-2 truncate">{space.features}</p>
                    )}
                  </div>
                </div>
                {space.isAvailable && (
                  <Link
                    to={`/facilities/book?space=${space.id}`}
                    className="mt-3 block w-full text-center px-3 py-2 text-sm font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition"
                  >
                    Book This Space
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnnouncementsTab({ announcements }: { announcements: FacilityAnnouncement[] }) {
  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
        <p className="text-gray-500">There are no active announcements for this office.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{announcement.title}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <p className="text-gray-700 mt-2 whitespace-pre-wrap">{announcement.content}</p>
        </div>
      ))}
    </div>
  );
}
