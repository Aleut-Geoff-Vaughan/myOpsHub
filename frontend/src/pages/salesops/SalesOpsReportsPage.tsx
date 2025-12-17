import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Download,
  DollarSign,
  Target,
  Building2,
  Users,
  Calendar,
  Award,
  XCircle,
} from 'lucide-react';
import { useOpportunities } from '../../hooks/useSalesOps';
import { OpportunityResult } from '../../services/salesOpsService';
import { format, subMonths, startOfMonth } from 'date-fns';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Simple horizontal bar component
function HorizontalBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Report card component
function ReportCard({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <Icon className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function SalesOpsReportsPage() {
  const [dateRange, setDateRange] = useState<'3m' | '6m' | '12m' | 'all'>('all');

  const { data: opportunitiesResponse, isLoading: oppsLoading } = useOpportunities();

  const opportunities = opportunitiesResponse?.items || [];

  // Calculate date range filter based on close date (since createdAt isn't available in list dto)
  const dateFilteredOpps = useMemo(() => {
    if (dateRange === 'all') return opportunities;

    const months = dateRange === '3m' ? 3 : dateRange === '6m' ? 6 : 12;
    const cutoffDate = startOfMonth(subMonths(new Date(), months));

    return opportunities.filter((o) => {
      if (!o.closeDate) return true;
      return new Date(o.closeDate) >= cutoffDate;
    });
  }, [opportunities, dateRange]);

  // Win/Loss Analysis
  const winLossStats = useMemo(() => {
    const closed = dateFilteredOpps.filter((o) => o.result !== undefined);
    const won = closed.filter((o) => o.result === OpportunityResult.Won);
    const lost = closed.filter((o) => o.result === OpportunityResult.Lost);
    const noBid = closed.filter((o) => o.result === OpportunityResult.NoBid);

    const wonValue = won.reduce((sum, o) => sum + o.amount, 0);
    const lostValue = lost.reduce((sum, o) => sum + o.amount, 0);

    const winRate = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0;
    const winRateByValue = (wonValue + lostValue) > 0 ? Math.round((wonValue / (wonValue + lostValue)) * 100) : 0;

    return { won, lost, noBid, wonValue, lostValue, winRate, winRateByValue, closed };
  }, [dateFilteredOpps]);

  // Pipeline by Stage
  const pipelineByStage = useMemo(() => {
    const active = dateFilteredOpps.filter((o) => o.result === undefined);
    const byStage: Record<string, { count: number; value: number; color?: string }> = {};

    active.forEach((o) => {
      const stageName = o.stageName || 'Unknown';
      if (!byStage[stageName]) {
        byStage[stageName] = { count: 0, value: 0, color: o.stageColor };
      }
      byStage[stageName].count++;
      byStage[stageName].value += o.amount;
    });

    return Object.entries(byStage)
      .sort((a, b) => b[1].value - a[1].value);
  }, [dateFilteredOpps]);

  // Pipeline by Account
  const pipelineByAccount = useMemo(() => {
    const active = dateFilteredOpps.filter((o) => o.result === undefined);
    const byAccount: Record<string, { count: number; value: number; name: string }> = {};

    active.forEach((o) => {
      const accountId = o.accountId || 'unassigned';
      const accountName = o.accountName || 'Unassigned';
      if (!byAccount[accountId]) {
        byAccount[accountId] = { count: 0, value: 0, name: accountName };
      }
      byAccount[accountId].count++;
      byAccount[accountId].value += o.amount;
    });

    return Object.entries(byAccount)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 10);
  }, [dateFilteredOpps]);

  // 8(a) Utilization - based on opportunities with bidding entities assigned
  // Note: In the list view, we only have biddingEntityName, not the full is8a flag
  // Opportunities with a bidding entity are typically 8(a) set-aside opportunities
  const eightAStats = useMemo(() => {
    const active = dateFilteredOpps.filter((o) => o.result === undefined);
    const withBiddingEntity = active.filter((o) => o.biddingEntityName);
    const withoutBiddingEntity = active.filter((o) => !o.biddingEntityName);

    const withBEValue = withBiddingEntity.reduce((sum, o) => sum + o.amount, 0);
    const withoutBEValue = withoutBiddingEntity.reduce((sum, o) => sum + o.amount, 0);

    return {
      eightACount: withBiddingEntity.length,
      nonEightACount: withoutBiddingEntity.length,
      eightAValue: withBEValue,
      nonEightAValue: withoutBEValue,
      eightAPercent: active.length > 0
        ? Math.round((withBiddingEntity.length / active.length) * 100)
        : 0,
    };
  }, [dateFilteredOpps]);

  // Export report data
  const handleExportReport = (reportType: string) => {
    let csv = '';
    const timestamp = format(new Date(), 'yyyy-MM-dd');

    switch (reportType) {
      case 'winloss': {
        csv = 'Status,Count,Value\n';
        csv += `Won,${winLossStats.won.length},${winLossStats.wonValue}\n`;
        csv += `Lost,${winLossStats.lost.length},${winLossStats.lostValue}\n`;
        csv += `No Bid,${winLossStats.noBid.length},0\n`;
        break;
      }
      case 'pipeline': {
        csv = 'Stage,Count,Value\n';
        pipelineByStage.forEach(([stage, data]) => {
          csv += `"${stage}",${data.count},${data.value}\n`;
        });
        break;
      }
      case 'accounts': {
        csv = 'Account,Count,Value\n';
        pipelineByAccount.forEach(([, data]) => {
          csv += `"${data.name}",${data.count},${data.value}\n`;
        });
        break;
      }
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salesops-${reportType}-${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (oppsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const maxStageValue = Math.max(...pipelineByStage.map(([, d]) => d.value), 1);
  const maxAccountValue = Math.max(...pipelineByAccount.map(([, d]) => d.value), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sales performance insights and analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="date-range" className="text-sm text-gray-600">Period:</label>
          <select
            id="date-range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '3m' | '6m' | '12m' | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Award className="h-4 w-4" />
            Win Rate
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{winLossStats.winRate}%</p>
          <p className="text-xs text-gray-500">By count</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <DollarSign className="h-4 w-4" />
            Win Rate (Value)
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{winLossStats.winRateByValue}%</p>
          <p className="text-xs text-gray-500">By dollar value</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Target className="h-4 w-4" />
            Active Pipeline
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {dateFilteredOpps.filter((o) => o.result === undefined).length}
          </p>
          <p className="text-xs text-gray-500">Opportunities</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Building2 className="h-4 w-4" />
            Set-Aside Pipeline
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{eightAStats.eightAPercent}%</p>
          <p className="text-xs text-gray-500">{eightAStats.eightACount} with bidding entity</p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win/Loss Analysis */}
        <ReportCard title="Win/Loss Analysis" icon={PieChart}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-gray-600">Won</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Lost</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm text-gray-600">No Bid</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleExportReport('winloss')}
                className="text-sm text-orange-600 hover:text-orange-700"
                title="Export Win/Loss data as CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>

            {winLossStats.closed.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <XCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No closed deals in this period</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{winLossStats.won.length}</p>
                    <p className="text-sm text-gray-600">Won</p>
                    <p className="text-xs text-gray-500">{formatCurrency(winLossStats.wonValue)}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{winLossStats.lost.length}</p>
                    <p className="text-sm text-gray-600">Lost</p>
                    <p className="text-xs text-gray-500">{formatCurrency(winLossStats.lostValue)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{winLossStats.noBid.length}</p>
                    <p className="text-sm text-gray-600">No Bid</p>
                    <p className="text-xs text-gray-500">-</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Win Rate (Count)</span>
                    <span className="font-semibold text-gray-900">{winLossStats.winRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${winLossStats.winRate}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </ReportCard>

        {/* Pipeline by Stage */}
        <ReportCard title="Pipeline by Stage" icon={BarChart3}>
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleExportReport('pipeline')}
                className="text-sm text-orange-600 hover:text-orange-700"
                title="Export Pipeline data as CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>

            {pipelineByStage.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No active opportunities</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pipelineByStage.slice(0, 6).map(([stage, data]) => (
                  <HorizontalBar
                    key={stage}
                    label={`${stage} (${data.count})`}
                    value={data.value}
                    maxValue={maxStageValue}
                    color={data.color ? `bg-[${data.color}]` : 'bg-orange-500'}
                  />
                ))}
              </div>
            )}
          </div>
        </ReportCard>

        {/* Top Accounts */}
        <ReportCard title="Pipeline by Account" icon={Users}>
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleExportReport('accounts')}
                className="text-sm text-orange-600 hover:text-orange-700"
                title="Export Account data as CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>

            {pipelineByAccount.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No opportunities with accounts</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pipelineByAccount.slice(0, 6).map(([id, data]) => (
                  <HorizontalBar
                    key={id}
                    label={`${data.name} (${data.count})`}
                    value={data.value}
                    maxValue={maxAccountValue}
                    color="bg-blue-500"
                  />
                ))}
              </div>
            )}
          </div>
        </ReportCard>

        {/* Bidding Entity Utilization (8(a) and Set-Asides) */}
        <ReportCard title="Set-Aside Opportunities" icon={Building2}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{eightAStats.eightACount}</p>
                <p className="text-sm text-gray-600">With Bidding Entity</p>
                <p className="text-xs text-gray-500">{formatCurrency(eightAStats.eightAValue)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{eightAStats.nonEightACount}</p>
                <p className="text-sm text-gray-600">Direct / Full & Open</p>
                <p className="text-xs text-gray-500">{formatCurrency(eightAStats.nonEightAValue)}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Set-Aside Pipeline Share</span>
                <span className="font-semibold text-gray-900">{eightAStats.eightAPercent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${eightAStats.eightAPercent}%` }}
                />
              </div>
            </div>

            <Link
              to="/salesops/entities"
              className="block text-center text-sm text-orange-600 hover:text-orange-700 pt-2"
            >
              Manage Bidding Entities
            </Link>
          </div>
        </ReportCard>
      </div>

      {/* Power BI Integration Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Power BI Integration</h3>
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Coming Soon</span>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900">Advanced Analytics with Power BI</h4>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Connect your Power BI dashboards for advanced analytics, custom visualizations,
            and real-time reporting on your sales pipeline.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              Trend Analysis
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              Time-Series Reports
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
              <Target className="h-4 w-4" />
              Goal Tracking
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            Power BI integration will be available in Phase 2
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Related Pages</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/salesops/forecast"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Sales Forecast</span>
          </Link>
          <Link
            to="/salesops/pipeline"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Pipeline Board</span>
          </Link>
          <Link
            to="/salesops/opportunities"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <Target className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">All Opportunities</span>
          </Link>
          <Link
            to="/salesops/entities"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <Building2 className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Bidding Entities</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SalesOpsReportsPage;
