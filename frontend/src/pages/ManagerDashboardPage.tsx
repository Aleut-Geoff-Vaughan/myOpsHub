import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { useInbox } from '../hooks/useInbox';
import { usePeople } from '../hooks/usePeople';
import { useProjects } from '../hooks/useProjects';
import { useAssignments } from '../hooks/useAssignments';
import { AssignmentRequestStatus, ProjectStatus, AssignmentStatus } from '../types/api';

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { user, currentWorkspace } = useAuthStore();
  const tenantId = currentWorkspace?.tenantId;

  // Fetch data for dashboard widgets
  const { data: inbox = [], isLoading: inboxLoading } = useInbox(
    tenantId ? { tenantId, status: AssignmentRequestStatus.Pending } : undefined
  );

  const { data: people = [], isLoading: peopleLoading } = usePeople({
    tenantId: tenantId || '',
  });

  const { data: projects = [], isLoading: projectsLoading } = useProjects({
    tenantId,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments({
    tenantId,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const pendingRequests = inbox.filter(
      (r) => r.status === AssignmentRequestStatus.Pending
    ).length;

    const activeProjects = projects.filter(
      (p) => p.status === ProjectStatus.Active
    ).length;

    const activeAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.Active
    ).length;

    const pendingAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.PendingApproval
    ).length;

    const totalPeople = people.length;

    return {
      pendingRequests,
      activeProjects,
      activeAssignments,
      pendingAssignments,
      totalPeople,
    };
  }, [inbox, projects, assignments, people]);

  // Recent pending requests for quick action
  const recentPendingRequests = useMemo(() => {
    return inbox
      .filter((r) => r.status === AssignmentRequestStatus.Pending)
      .slice(0, 5);
  }, [inbox]);

  // Active projects list
  const recentActiveProjects = useMemo(() => {
    return projects
      .filter((p) => p.status === ProjectStatus.Active)
      .slice(0, 5);
  }, [projects]);

  const isLoading = inboxLoading || peopleLoading || projectsLoading || assignmentsLoading;

  if (!user) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your team, projects, and pending actions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          color="bg-amber-500"
          loading={isLoading}
          onClick={() => navigate('/inbox')}
        />
        <StatCard
          title="Team Members"
          value={stats.totalPeople}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="bg-blue-500"
          loading={isLoading}
          onClick={() => navigate('/people')}
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="bg-green-500"
          loading={isLoading}
          onClick={() => navigate('/projects')}
        />
        <StatCard
          title="Active Assignments"
          value={stats.activeAssignments}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="bg-indigo-500"
          loading={isLoading}
          onClick={() => navigate('/staffing/manage')}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingAssignments}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="bg-purple-500"
          loading={isLoading}
          onClick={() => navigate('/inbox')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader
            title="Pending Assignment Requests"
            subtitle="Requests awaiting your review"
            action={
              stats.pendingRequests > 0 ? (
                <button
                  type="button"
                  onClick={() => navigate('/inbox')}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  View All
                </button>
              ) : undefined
            }
          />
          <CardBody>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : recentPendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">No pending requests</p>
                <p className="text-sm text-gray-400 mt-1">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    onClick={() => navigate('/inbox')}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Assignment Request
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.allocationPct}% allocation
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader
            title="Active Projects"
            subtitle="Currently active projects in your organization"
            action={
              stats.activeProjects > 0 ? (
                <button
                  type="button"
                  onClick={() => navigate('/projects')}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  View All
                </button>
              ) : undefined
            }
          />
          <CardBody>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                      <div className="h-3 bg-gray-200 rounded w-28"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : recentActiveProjects.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No active projects</p>
                <p className="text-sm text-gray-400 mt-1">Create a new project to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActiveProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    onClick={() => navigate('/projects')}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">
                        {project.customer || 'No customer assigned'}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Manage Team Staffing"
            description="Assign team members to projects"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            color="text-blue-600"
            onClick={() => navigate('/staffing/manage')}
          />
          <QuickActionCard
            title="View Team Calendar"
            description="See team availability and schedules"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="text-green-600"
            onClick={() => navigate('/team-calendar')}
          />
          <QuickActionCard
            title="Review Requests"
            description="Approve or reject pending requests"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="text-amber-600"
            onClick={() => navigate('/inbox')}
          />
          <QuickActionCard
            title="View Reports"
            description="Access analytics and reports"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            color="text-purple-600"
            onClick={() => navigate('/reports')}
          />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, icon, color, loading, onClick }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          )}
        </div>
        <div className={`${color} rounded-lg p-2`}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
    </div>
  );
}

// Quick Action Card Component
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

function QuickActionCard({ title, description, icon, color, onClick }: QuickActionCardProps) {
  return (
    <Card hover onClick={onClick}>
      <CardBody className="text-center py-6">
        <div className={`mx-auto mb-3 ${color}`}>{icon}</div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </CardBody>
    </Card>
  );
}

export default ManagerDashboardPage;
