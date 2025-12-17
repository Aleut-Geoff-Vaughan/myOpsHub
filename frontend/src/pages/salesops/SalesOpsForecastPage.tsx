import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
} from 'lucide-react';
import { useOpportunities, useStages } from '../../hooks/useSalesOps';
import { format, addMonths, startOfMonth } from 'date-fns';

// Fiscal year utilities (Federal FY starts October)
function getFiscalYear(date: Date, fyStartMonth: number = 10): number {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  return month >= fyStartMonth ? year + 1 : year;
}

function getFiscalQuarter(date: Date, fyStartMonth: number = 10): number {
  const month = date.getMonth() + 1; // 1-12
  // Adjust month to fiscal year month (0-11 where 0 is the start of FY)
  const fyMonth = (month - fyStartMonth + 12) % 12;
  return Math.floor(fyMonth / 3) + 1;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

interface ForecastRow {
  fiscalYear: number;
  quarters: {
    [key: string]: {
      count: number;
      amount: number;
      weightedAmount: number;
      opportunities: Array<{
        id: string;
        name: string;
        amount: number;
        probabilityPercent: number;
        stageName?: string;
      }>;
    };
  };
  totalCount: number;
  totalAmount: number;
  totalWeighted: number;
}

export function SalesOpsForecastPage() {
  const [viewMode, setViewMode] = useState<'weighted' | 'unweighted'>('weighted');
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(new Set());
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [showClosedDeals, setShowClosedDeals] = useState(false);

  const { data: opportunitiesResponse, isLoading } = useOpportunities();
  const { data: stages } = useStages();

  const opportunities = opportunitiesResponse?.items || [];

  // Filter and group opportunities
  const forecastData = useMemo(() => {
    let filtered = opportunities;

    // Filter by stage
    if (stageFilter !== 'all') {
      filtered = filtered.filter((o) => o.stageId === stageFilter);
    }

    // Filter closed deals
    if (!showClosedDeals) {
      filtered = filtered.filter((o) => o.result === undefined);
    }

    // Group by fiscal year and quarter
    const byYear: Record<number, ForecastRow> = {};

    filtered.forEach((opp) => {
      if (!opp.closeDate) return;

      const closeDate = new Date(opp.closeDate);
      const fy = getFiscalYear(closeDate);
      const fq = getFiscalQuarter(closeDate);
      const qKey = `Q${fq}`;

      if (!byYear[fy]) {
        byYear[fy] = {
          fiscalYear: fy,
          quarters: {
            Q1: { count: 0, amount: 0, weightedAmount: 0, opportunities: [] },
            Q2: { count: 0, amount: 0, weightedAmount: 0, opportunities: [] },
            Q3: { count: 0, amount: 0, weightedAmount: 0, opportunities: [] },
            Q4: { count: 0, amount: 0, weightedAmount: 0, opportunities: [] },
          },
          totalCount: 0,
          totalAmount: 0,
          totalWeighted: 0,
        };
      }

      byYear[fy].quarters[qKey].count++;
      byYear[fy].quarters[qKey].amount += opp.amount;
      byYear[fy].quarters[qKey].weightedAmount += opp.weightedAmount;
      byYear[fy].quarters[qKey].opportunities.push({
        id: opp.id,
        name: opp.name,
        amount: opp.amount,
        probabilityPercent: opp.probabilityPercent,
        stageName: opp.stageName,
      });

      byYear[fy].totalCount++;
      byYear[fy].totalAmount += opp.amount;
      byYear[fy].totalWeighted += opp.weightedAmount;
    });

    return Object.values(byYear).sort((a, b) => a.fiscalYear - b.fiscalYear);
  }, [opportunities, stageFilter, showClosedDeals]);

  // Calculate totals
  const totals = useMemo(() => {
    return forecastData.reduce(
      (acc, row) => ({
        count: acc.count + row.totalCount,
        amount: acc.amount + row.totalAmount,
        weighted: acc.weighted + row.totalWeighted,
      }),
      { count: 0, amount: 0, weighted: 0 }
    );
  }, [forecastData]);

  // Generate forecast months for next 12 months
  const upcomingMonths = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const monthDate = startOfMonth(addMonths(today, i));
      const fy = getFiscalYear(monthDate);
      const fq = getFiscalQuarter(monthDate);
      months.push({
        date: monthDate,
        label: format(monthDate, 'MMM yyyy'),
        fiscalYear: fy,
        fiscalQuarter: fq,
      });
    }
    return months;
  }, []);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const toggleQuarter = (key: string) => {
    setExpandedQuarters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleExport = () => {
    // Generate CSV export
    const headers = ['Fiscal Year', 'Quarter', 'Opportunity', 'Amount', 'Probability', 'Weighted Amount', 'Stage'];
    const rows: string[][] = [];

    forecastData.forEach((fyData) => {
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach((q) => {
        fyData.quarters[q].opportunities.forEach((opp) => {
          rows.push([
            `FY${fyData.fiscalYear}`,
            q,
            `"${opp.name}"`,
            opp.amount.toString(),
            `${opp.probabilityPercent}%`,
            (opp.amount * opp.probabilityPercent / 100).toFixed(0),
            opp.stageName || '',
          ]);
        });
      });
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-forecast-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Forecast</h1>
          <p className="mt-1 text-sm text-gray-500">
            Revenue projections by fiscal year and quarter (Federal FY: Oct-Sep)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pipeline</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.amount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Weighted Forecast</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.weighted)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Opportunities</p>
              <p className="text-2xl font-bold text-gray-900">{totals.count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="view-mode" className="text-sm text-gray-600">View:</label>
            <select
              id="view-mode"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'weighted' | 'unweighted')}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="weighted">Weighted</option>
              <option value="unweighted">Unweighted</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="stage-filter" className="text-sm text-gray-600">Stage:</label>
            <select
              id="stage-filter"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="all">All Stages</option>
              {stages?.filter((s) => s.isActive).map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showClosedDeals}
              onChange={(e) => setShowClosedDeals(e.target.checked)}
              className="h-4 w-4 text-orange-600 border-gray-300 rounded"
            />
            Include Closed Deals
          </label>
        </div>
      </div>

      {/* Forecast Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-48">
                  Fiscal Year
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Q1 (Oct-Dec)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Q2 (Jan-Mar)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Q3 (Apr-Jun)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Q4 (Jul-Sep)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 bg-gray-100">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forecastData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium">No forecast data</p>
                    <p className="text-sm mt-1">
                      Add opportunities with close dates to see the forecast.
                    </p>
                    <Link
                      to="/salesops/opportunities/new"
                      className="inline-block mt-4 text-sm text-orange-600 hover:text-orange-700"
                    >
                      Create Opportunity
                    </Link>
                  </td>
                </tr>
              ) : (
                <>
                  {forecastData.map((row) => (
                    <>
                      {/* Year row */}
                      <tr
                        key={row.fiscalYear}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleYear(row.fiscalYear)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {expandedYears.has(row.fiscalYear) ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="font-semibold text-gray-900">FY{row.fiscalYear}</span>
                            <span className="text-xs text-gray-500">({row.totalCount} opps)</span>
                          </div>
                        </td>
                        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                          const qData = row.quarters[q];
                          const value = viewMode === 'weighted' ? qData.weightedAmount : qData.amount;
                          return (
                            <td key={q} className="px-4 py-3 text-right">
                              {qData.count > 0 ? (
                                <div>
                                  <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
                                  <span className="block text-xs text-gray-500">{qData.count} opps</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right bg-gray-50">
                          <span className="font-bold text-gray-900">
                            {formatCurrency(viewMode === 'weighted' ? row.totalWeighted : row.totalAmount)}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded quarter details */}
                      {expandedYears.has(row.fiscalYear) && (
                        <>
                          {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                            const qData = row.quarters[q];
                            if (qData.count === 0) return null;
                            const qKey = `${row.fiscalYear}-${q}`;
                            return (
                              <>
                                <tr
                                  key={qKey}
                                  className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleQuarter(qKey);
                                  }}
                                >
                                  <td className="px-4 py-2 pl-10">
                                    <div className="flex items-center gap-2">
                                      {expandedQuarters.has(qKey) ? (
                                        <ChevronDown className="h-3 w-3 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-gray-400" />
                                      )}
                                      <span className="text-sm text-gray-700">{q}</span>
                                    </div>
                                  </td>
                                  <td colSpan={5} className="px-4 py-2 text-right text-sm text-gray-600">
                                    {formatCurrency(viewMode === 'weighted' ? qData.weightedAmount : qData.amount)}
                                    <span className="ml-2 text-gray-400">({qData.count})</span>
                                  </td>
                                </tr>

                                {/* Individual opportunities */}
                                {expandedQuarters.has(qKey) &&
                                  qData.opportunities.map((opp) => (
                                    <tr key={opp.id} className="bg-white">
                                      <td className="px-4 py-2 pl-16" colSpan={4}>
                                        <Link
                                          to={`/salesops/opportunities/${opp.id}`}
                                          className="text-sm text-orange-600 hover:text-orange-700"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {opp.name}
                                        </Link>
                                        {opp.stageName && (
                                          <span className="ml-2 text-xs text-gray-500">
                                            ({opp.stageName})
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-right text-sm text-gray-600">
                                        {formatCurrency(opp.amount)}
                                        <span className="ml-2 text-gray-400">
                                          {opp.probabilityPercent}%
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-right text-sm font-medium text-gray-900 bg-gray-50">
                                        {formatCurrency(opp.amount * opp.probabilityPercent / 100)}
                                      </td>
                                    </tr>
                                  ))}
                              </>
                            );
                          })}
                        </>
                      )}
                    </>
                  ))}

                  {/* Totals row */}
                  <tr className="bg-orange-50 border-t-2 border-orange-200 font-bold">
                    <td className="px-4 py-3 text-gray-900">Total</td>
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                      const qTotal = forecastData.reduce(
                        (sum, row) => sum + (viewMode === 'weighted' ? row.quarters[q].weightedAmount : row.quarters[q].amount),
                        0
                      );
                      return (
                        <td key={q} className="px-4 py-3 text-right text-gray-900">
                          {qTotal > 0 ? formatCurrency(qTotal) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right text-orange-700 bg-orange-100">
                      {formatCurrency(viewMode === 'weighted' ? totals.weighted : totals.amount)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">12-Month Outlook</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {upcomingMonths.map((month) => {
            // Find opportunities closing this month
            const monthOpps = opportunities.filter((o) => {
              if (!o.closeDate || o.result !== undefined) return false;
              const closeDate = new Date(o.closeDate);
              return (
                closeDate.getMonth() === month.date.getMonth() &&
                closeDate.getFullYear() === month.date.getFullYear()
              );
            });
            const monthTotal = monthOpps.reduce((sum, o) => sum + (viewMode === 'weighted' ? o.weightedAmount : o.amount), 0);

            return (
              <div
                key={month.label}
                className={`p-3 rounded-lg border ${
                  monthOpps.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <p className="text-xs text-gray-500">{month.label}</p>
                <p className="text-xs text-gray-400">FY{month.fiscalYear} Q{month.fiscalQuarter}</p>
                <p className={`text-lg font-bold mt-1 ${monthOpps.length > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                  {monthTotal > 0 ? formatCurrency(monthTotal) : '-'}
                </p>
                <p className="text-xs text-gray-500">
                  {monthOpps.length} opp{monthOpps.length !== 1 ? 's' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SalesOpsForecastPage;
