import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore, AppRole } from '../../stores/authStore';
import { useInbox } from '../../hooks/useInbox';
import { AssignmentRequestStatus } from '../../types/api';
import { NotificationBanner } from '../NotificationBanner';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles?: AppRole[];
}

interface NavGroup {
  name: string;
  icon: React.ReactNode;
  roles?: AppRole[];
  items: NavItem[];
  subgroups?: { name: string; items: NavItem[] }[];
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Me: true, Manager: true });
  const location = useLocation();
  const { user, currentWorkspace, logout, hasRole } = useAuthStore();

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };
  const { data: inbox = [] } = useInbox(
    currentWorkspace?.tenantId
      ? { tenantId: currentWorkspace.tenantId, status: AssignmentRequestStatus.Pending }
      : undefined
  );
  const unreadCount = inbox.filter((i) => i.status === AssignmentRequestStatus.Pending).length;

  // Icons for reuse
  const icons = {
    dashboard: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    staffing: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    hoteling: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    resume: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    doa: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    people: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    teamStaffing: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    calendar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    projects: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    wbs: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    templates: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    facilities: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    reports: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    staffingAdmin: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    managerDashboard: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    user: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    manager: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    chevronDown: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ),
    chevronRight: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
  };

  // Grouped navigation structure
  const navigationGroups: NavGroup[] = [
    {
      name: 'Me',
      icon: icons.user,
      items: [
        { name: 'Dashboard', path: '/', icon: icons.dashboard },
        { name: 'Staffing', path: '/staffing', icon: icons.staffing },
        { name: 'Hotelling', path: '/hoteling', icon: icons.hoteling },
        { name: 'Resumes', path: '/resumes', icon: icons.resume },
        { name: 'DOA Letters', path: '/doa', icon: icons.doa },
      ],
    },
    {
      name: 'Manager',
      icon: icons.manager,
      roles: [AppRole.TeamLead, AppRole.ResourceManager, AppRole.ProjectManager, AppRole.TenantAdmin, AppRole.SysAdmin, AppRole.Executive],
      items: [
        { name: 'Manager Dashboard', path: '/manager-dashboard', icon: icons.managerDashboard },
        { name: 'People', path: '/people', icon: icons.people },
        { name: 'Team Staffing', path: '/staffing/manage', icon: icons.teamStaffing },
        { name: 'Team Calendar', path: '/team-calendar', icon: icons.calendar },
      ],
      subgroups: [
        {
          name: 'Projects & Work',
          items: [
            { name: 'Projects', path: '/projects', icon: icons.projects, roles: [AppRole.ProjectManager, AppRole.ResourceManager, AppRole.SysAdmin] },
            { name: 'WBS', path: '/wbs', icon: icons.wbs, roles: [AppRole.ProjectManager, AppRole.ResourceManager, AppRole.SysAdmin] },
            { name: 'Templates', path: '/templates', icon: icons.templates },
            { name: 'Facilities', path: '/facilities', icon: icons.facilities, roles: [AppRole.OfficeManager, AppRole.ResourceManager, AppRole.TenantAdmin, AppRole.SysAdmin] },
          ],
        },
        {
          name: 'Administration',
          items: [
            { name: 'Staffing Admin', path: '/staffing/admin', icon: icons.staffingAdmin, roles: [AppRole.ResourceManager, AppRole.TenantAdmin, AppRole.SysAdmin] },
            { name: 'Reports', path: '/reports', icon: icons.reports, roles: [AppRole.ProjectManager, AppRole.ResourceManager, AppRole.Executive, AppRole.SysAdmin] },
          ],
        },
      ],
    },
  ];

  // Filter groups and items based on roles
  const filteredGroups = navigationGroups
    .filter((group) => !group.roles || group.roles.some((role) => hasRole(role)))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.some((role) => hasRole(role))),
      subgroups: group.subgroups?.map((subgroup) => ({
        ...subgroup,
        items: subgroup.items.filter((item) => !item.roles || item.roles.some((role) => hasRole(role))),
      })).filter((subgroup) => subgroup.items.length > 0),
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Banner */}
      <NotificationBanner />

      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-4 flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">myScheduling</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {(hasRole(AppRole.SysAdmin) || hasRole(AppRole.TenantAdmin)) && (
                <Link to="/admin" className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              )}
              <Link to="/inbox" className="relative text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 7l2 12h14l2-12M3 7l6-4h6l6 4" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
                    {unreadCount}
                  </span>
                )}
              </Link>
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-3 hover:opacity-80 transition">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 hover:text-blue-600 transition">
                      {user?.displayName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold">
                      {user?.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } bg-white shadow-sm transition-all duration-300 overflow-hidden overflow-y-auto`}
        >
          <nav className="mt-4 px-3 pb-24 space-y-2">
            {filteredGroups.map((group) => (
              <div key={group.name} className="space-y-1">
                {/* Group Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-900 rounded-lg hover:bg-gray-100 transition"
                  title={`Toggle ${group.name} menu`}
                >
                  <div className="flex items-center">
                    <span className="text-primary-600">{group.icon}</span>
                    <span className="ml-3">{group.name}</span>
                  </div>
                  <span className="text-gray-400 transition-transform duration-200" style={{ transform: expandedGroups[group.name] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                    {icons.chevronDown}
                  </span>
                </button>

                {/* Group Items */}
                <div className={`space-y-1 overflow-hidden transition-all duration-200 ${expandedGroups[group.name] ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`${
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        } group flex items-center pl-8 pr-3 py-2 text-sm font-medium rounded-lg transition`}
                      >
                        <span className={isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}>
                          {item.icon}
                        </span>
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    );
                  })}

                  {/* Subgroups */}
                  {group.subgroups?.map((subgroup) => (
                    <div key={subgroup.name} className="mt-2">
                      <div className="px-8 py-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {subgroup.name}
                        </span>
                      </div>
                      {subgroup.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`${
                              isActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            } group flex items-center pl-8 pr-3 py-2 text-sm font-medium rounded-lg transition`}
                          >
                            <span className={isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}>
                              {item.icon}
                            </span>
                            <span className="ml-3">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer - Role Badges */}
          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-2">
              {currentWorkspace?.type === 'admin' ? 'Admin Access' : 'Your Roles'}
            </p>
            <div className="flex flex-wrap gap-1">
              {currentWorkspace?.type === 'admin' ? (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  System Admin
                </span>
              ) : (
                currentWorkspace?.roles?.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {role}
                  </span>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
