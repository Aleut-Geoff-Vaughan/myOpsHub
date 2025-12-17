import { Link } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  Building2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import {
  useOpportunities,
  useAccounts,
  useBiddingEntities,
  useExpiringBiddingEntities,
} from '../../hooks/useSalesOps';
import { format } from 'date-fns';

interface DashboardMetric {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: string;
}

// SBA Alert Component
function SbaAlertBanner() {
  const { data: expiringEntities, isLoading } = useExpiringBiddingEntities(90);
  const { data: allEntities } = useBiddingEntities();

  // Check if there are any 8(a) entities
  const has8aEntities = allEntities?.some((e) => e.is8a) || false;

  if (isLoading) {
    return null;
  }

  // No 8(a) entities configured - show setup prompt
  if (!has8aEntities) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Track 8(a) Certifications</h3>
            <p className="mt-1 text-sm text-blue-700">
              Add your 8(a) bidding entities to receive alerts when SBA certifications are
              approaching expiration.{' '}
              <Link to="/salesops/entities" className="underline font-medium">
                Set up bidding entities
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No expiring certifications - show success message
  if (!expiringEntities || expiringEntities.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-green-800">8(a) Certifications Current</h3>
            <p className="mt-1 text-sm text-green-700">
              All 8(a) certifications are current with no expirations in the next 90 days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Expiring certifications - show alert
  const criticalCount = expiringEntities.filter(
    (e) => e.daysUntilSbaExpiration !== undefined && e.daysUntilSbaExpiration <= 30
  ).length;

  return (
    <div
      className={`rounded-lg p-4 border ${
        criticalCount > 0
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
            criticalCount > 0 ? 'text-red-600' : 'text-amber-600'
          }`}
        />
        <div className="flex-1">
          <h3
            className={`text-sm font-medium ${
              criticalCount > 0 ? 'text-red-800' : 'text-amber-800'
            }`}
          >
            8(a) Certifications Expiring Soon
            {criticalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">
                {criticalCount} Critical
              </span>
            )}
          </h3>
          <div className="mt-2 space-y-2">
            {expiringEntities.slice(0, 5).map((entity) => {
              const days = entity.daysUntilSbaExpiration;
              const isExpired = days !== undefined && days < 0;
              const isCritical = days !== undefined && days <= 30;

              return (
                <div
                  key={entity.id}
                  className="flex items-center justify-between text-sm"
                >
                  <Link
                    to={`/salesops/entities/${entity.id}`}
                    className={`font-medium hover:underline ${
                      criticalCount > 0 ? 'text-red-700' : 'text-amber-700'
                    }`}
                  >
                    {entity.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        isExpired
                          ? 'text-red-600 font-semibold'
                          : isCritical
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {isExpired
                        ? 'EXPIRED'
                        : days !== undefined
                        ? `${days} days left`
                        : ''}
                    </span>
                    {entity.sbaExpirationDate && (
                      <span className="text-xs text-gray-500">
                        ({format(new Date(entity.sbaExpirationDate), 'MMM d, yyyy')})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {expiringEntities.length > 5 && (
              <Link
                to="/salesops/entities"
                className={`text-xs underline ${
                  criticalCount > 0 ? 'text-red-600' : 'text-amber-600'
                }`}
              >
                +{expiringEntities.length - 5} more expiring within 90 days
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SalesOpsDashboardPage() {
  // Fetch real data
  const { data: opportunitiesResponse, isLoading: oppsLoading } = useOpportunities();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: entities } = useBiddingEntities();

  const isLoading = oppsLoading || accountsLoading;

  // Extract opportunities array from paginated response
  const opportunities = opportunitiesResponse?.items || [];

  // Calculate metrics
  const activeOpportunities = opportunities.filter((o) => o.result === undefined);
  const totalPipelineValue = activeOpportunities.reduce((sum, o) => sum + o.amount, 0);
  const weightedPipelineValue = activeOpportunities.reduce(
    (sum, o) => sum + o.amount * (o.probabilityPercent / 100),
    0
  );

  // Calculate win rate
  const closedOpportunities = opportunities.filter((o) => o.result !== undefined);
  const wonOpportunities = opportunities.filter((o) => o.result === 0); // Won = 0
  const winRate =
    closedOpportunities.length > 0
      ? Math.round((wonOpportunities.length / closedOpportunities.length) * 100)
      : 0;

  const metrics: DashboardMetric[] = [
    {
      label: 'Pipeline Value',
      value: totalPipelineValue > 0 ? `$${(totalPipelineValue / 1000000).toFixed(1)}M` : '$0',
      change:
        weightedPipelineValue > 0
          ? `Weighted: $${(weightedPipelineValue / 1000000).toFixed(1)}M`
          : 'Add opportunities',
      changeType: 'neutral',
      icon: DollarSign,
      color: 'orange',
    },
    {
      label: 'Active Opportunities',
      value: activeOpportunities.length,
      change:
        opportunities.length > activeOpportunities.length
          ? `${opportunities.length - activeOpportunities.length} closed`
          : 'Open pipeline',
      changeType: 'neutral',
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Accounts',
      value: accounts?.length || 0,
      change: entities?.length ? `${entities.length} bidding entities` : 'Add accounts',
      changeType: 'neutral',
      icon: Building2,
      color: 'emerald',
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      change:
        closedOpportunities.length > 0
          ? `${wonOpportunities.length}/${closedOpportunities.length} won`
          : 'No closed opps',
      changeType: winRate >= 50 ? 'positive' : winRate > 0 ? 'neutral' : 'neutral',
      icon: TrendingUp,
      color: 'violet',
    },
  ];

  const quickActions = [
    { name: 'New Opportunity', path: '/salesops/opportunities/new', icon: FileText },
    { name: 'Pipeline Board', path: '/salesops/pipeline', icon: BarChart3 },
    { name: 'Accounts', path: '/salesops/accounts', icon: Building2 },
    { name: 'Calendar', path: '/salesops/calendar', icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">mySalesOps Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Federal Government Opportunity Management
        </p>
      </div>

      {/* SBA Alert Banner - Real data */}
      <SbaAlertBanner />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                <metric.icon className={`h-5 w-5 text-${metric.color}-600`} />
              </div>
              {metric.change && (
                <span
                  className={`text-xs font-medium ${
                    metric.changeType === 'positive'
                      ? 'text-emerald-600'
                      : metric.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {metric.change}
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-500">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.path}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <action.icon className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline by Stage</h2>
          {activeOpportunities.length > 0 ? (
            <div className="space-y-3">
              {/* Group opportunities by stage */}
              {(() => {
                const stageGroups = activeOpportunities.reduce((acc, opp) => {
                  const stageName = opp.stageName || 'Unknown';
                  if (!acc[stageName]) {
                    acc[stageName] = { count: 0, value: 0, color: opp.stageColor };
                  }
                  acc[stageName].count++;
                  acc[stageName].value += opp.amount;
                  return acc;
                }, {} as Record<string, { count: number; value: number; color?: string }>);

                return Object.entries(stageGroups)
                  .sort((a, b) => b[1].value - a[1].value)
                  .slice(0, 6)
                  .map(([stage, data]) => (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: data.color || '#94a3b8' }}
                        />
                        <span className="text-sm text-gray-700">{stage}</span>
                        <span className="text-xs text-gray-400">({data.count})</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ${(data.value / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ));
              })()}
              <Link
                to="/salesops/pipeline"
                className="block text-center text-sm text-orange-600 hover:text-orange-700 pt-2 border-t border-gray-100"
              >
                View Pipeline Board
              </Link>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No opportunities yet</p>
                <Link
                  to="/salesops/opportunities/new"
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  Create your first opportunity
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Close Dates</h2>
          {(() => {
            const upcomingDeadlines = activeOpportunities
              .filter((o) => o.closeDate && new Date(o.closeDate) > new Date())
              .sort((a, b) => {
                const aDate = new Date(a.closeDate);
                const bDate = new Date(b.closeDate);
                return aDate.getTime() - bDate.getTime();
              })
              .slice(0, 5);

            if (upcomingDeadlines.length === 0) {
              return (
                <div className="h-48 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No upcoming close dates</p>
                    <p className="text-sm mt-1">
                      Close dates will appear here
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {upcomingDeadlines.map((opp) => (
                  <Link
                    key={opp.id}
                    to={`/salesops/opportunities/${opp.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {opp.name.length > 30
                            ? opp.name.slice(0, 30) + '...'
                            : opp.name}
                        </p>
                        <p className="text-xs text-gray-500">Close Date</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {format(new Date(opp.closeDate), 'MMM d')}
                    </span>
                  </Link>
                ))}
                <Link
                  to="/salesops/calendar"
                  className="block text-center text-sm text-orange-600 hover:text-orange-700 pt-2 border-t border-gray-100"
                >
                  View Calendar
                </Link>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Opportunities</h2>
        {opportunities.length > 0 ? (
          <div className="space-y-3">
            {[...opportunities]
              .sort((a, b) => b.weightedAmount - a.weightedAmount)
              .slice(0, 5)
              .map((opp) => (
                <Link
                  key={opp.id}
                  to={`/salesops/opportunities/${opp.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opp.name}</p>
                      <p className="text-xs text-gray-500">
                        {opp.stageName} - ${(opp.amount / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {opp.probabilityPercent}% likely
                  </span>
                </Link>
              ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>No opportunities yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesOpsDashboardPage;
