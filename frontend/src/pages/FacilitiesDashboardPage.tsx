import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { facilitiesPortalService, AnnouncementType, AnnouncementPriority } from '../services/facilitiesPortalService';

export function FacilitiesDashboardPage() {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['facilities-dashboard'],
    queryFn: () => facilitiesPortalService.getDashboard(),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
          <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
          <p className="text-red-600 text-sm mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  const getAnnouncementTypeBadge = (type: AnnouncementType) => {
    const badges: Record<AnnouncementType, { bg: string; text: string; label: string }> = {
      [AnnouncementType.General]: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'General' },
      [AnnouncementType.Maintenance]: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Maintenance' },
      [AnnouncementType.Safety]: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Safety' },
      [AnnouncementType.Policy]: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Policy' },
      [AnnouncementType.Event]: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Event' },
      [AnnouncementType.Emergency]: { bg: 'bg-red-100', text: 'text-red-700', label: 'Emergency' },
    };
    const badge = badges[type];
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getPriorityIcon = (priority: AnnouncementPriority) => {
    if (priority === AnnouncementPriority.High || priority === AnnouncementPriority.Urgent) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  const statCards = [
    {
      title: 'Offices',
      value: dashboard?.officeCount ?? 0,
      subValue: `${dashboard?.clientSiteCount ?? 0} client sites`,
      icon: (
        <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      link: '/facilities/offices',
    },
    {
      title: 'Spaces',
      value: dashboard?.totalSpaces ?? 0,
      subValue: `${dashboard?.todayBookings ?? 0} booked today`,
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      link: '/hoteling',
    },
    {
      title: 'Active Leases',
      value: dashboard?.activeLeases ?? 0,
      subValue: dashboard?.expiringLeases ? `${dashboard.expiringLeases} expiring soon` : 'All current',
      subValueClass: dashboard?.expiringLeases ? 'text-yellow-600' : 'text-gray-500',
      icon: (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/facilities/leases',
    },
    {
      title: 'Field Assignments',
      value: dashboard?.activeFieldAssignments ?? 0,
      subValue: dashboard?.pendingForeignTravel ? `${dashboard.pendingForeignTravel} pending travel` : 'No pending travel',
      subValueClass: dashboard?.pendingForeignTravel ? 'text-orange-600' : 'text-gray-500',
      icon: (
        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      link: '/facilities/field-assignments',
    },
  ];

  const quickActions = [
    {
      title: 'Quick Check-In',
      description: 'Check into an office location',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/facilities/check-in',
      color: 'bg-green-50 text-green-700 hover:bg-green-100',
    },
    {
      title: "Who's Here",
      description: 'See who is in the office',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: '/facilities/whos-here',
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    },
    {
      title: 'Office Directory',
      description: 'Find office information',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      link: '/facilities/offices',
      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    },
    {
      title: 'Travel Guides',
      description: 'Office travel information',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/facilities/travel-guides',
      color: 'bg-teal-50 text-teal-700 hover:bg-teal-100',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facilities Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your facilities and field operations</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {dashboard?.todayCheckIns ?? 0} check-ins today
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.subValueClass || 'text-gray-500'}`}>
                  {stat.subValue}
                </p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className={`flex items-center gap-4 p-4 rounded-lg transition ${action.color}`}
            >
              <div className="flex-shrink-0">{action.icon}</div>
              <div>
                <p className="font-medium">{action.title}</p>
                <p className="text-sm opacity-75">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Announcements</h2>
          <Link
            to="/facilities/announcements"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            View All
          </Link>
        </div>
        {dashboard?.recentAnnouncements?.length ? (
          <div className="space-y-3">
            {dashboard.recentAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {getPriorityIcon(announcement.priority)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getAnnouncementTypeBadge(announcement.type)}
                    {announcement.officeName && (
                      <span className="text-xs text-gray-500">{announcement.officeName}</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 truncate">{announcement.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
            <p>No recent announcements</p>
          </div>
        )}
      </div>

      {/* Maintenance Requests */}
      {dashboard?.openMaintenanceRequests ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">
                {dashboard.openMaintenanceRequests} open maintenance request
                {dashboard.openMaintenanceRequests !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-700">
                Review and address pending maintenance issues.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
