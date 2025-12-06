import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { staffingReportsService, type ProjectsSummaryItem } from '../services/forecastService';
import { projectsService } from '../services/projectsService';
import type { Project } from '../types/api';

// Extended project type that includes budget data (when available from API)
interface ProjectWithBudget extends Project {
  budgetedHours?: number;
}

export function BudgetManagementPage() {
  const { currentWorkspace } = useAuthStore();
  const tenantId = currentWorkspace?.tenantId || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'budget' | 'forecast' | 'variance'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch projects summary with forecast data
  const { data: projectsSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['forecast-projects', tenantId],
    queryFn: () => staffingReportsService.getProjectsSummary(),
    enabled: !!tenantId,
  });

  // Fetch all projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', tenantId],
    queryFn: () => projectsService.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  // Merge project data with forecast summary
  const projectData = useMemo(() => {
    const summaryMap: Record<string, ProjectsSummaryItem> = {};
    (projectsSummary?.projects || []).forEach(p => {
      summaryMap[p.id] = p;
    });

    return projects.map(project => {
      const summary = summaryMap[project.id];
      const forecastedHours = summary?.totalForecastedHours || 0;
      // Budget hours not yet in the API - use 0 as placeholder
      const budgetedHours = (project as ProjectWithBudget).budgetedHours || 0;
      const variance = budgetedHours > 0 ? ((forecastedHours - budgetedHours) / budgetedHours) * 100 : 0;

      return {
        ...project,
        forecastedHours,
        assignmentCount: summary?.assignmentCount || 0,
        budgetedHours,
        variance,
        varianceAbs: Math.abs(variance),
      };
    });
  }, [projects, projectsSummary]);

  // Filter and sort
  const filteredProjects = useMemo(() => {
    return projectData
      .filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.programCode?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'budget':
            comparison = (a.budgetedHours || 0) - (b.budgetedHours || 0);
            break;
          case 'forecast':
            comparison = a.forecastedHours - b.forecastedHours;
            break;
          case 'variance':
            comparison = a.variance - b.variance;
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [projectData, searchTerm, sortField, sortDirection]);

  // Summary stats
  const stats = useMemo(() => {
    const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budgetedHours || 0), 0);
    const totalForecast = filteredProjects.reduce((sum, p) => sum + p.forecastedHours, 0);
    const overBudgetCount = filteredProjects.filter(p => p.variance > 10).length;
    const underBudgetCount = filteredProjects.filter(p => p.variance < -10).length;
    const onTrackCount = filteredProjects.filter(p => Math.abs(p.variance) <= 10).length;
    const noBudgetCount = filteredProjects.filter(p => !p.budgetedHours).length;

    return { totalBudget, totalForecast, overBudgetCount, underBudgetCount, onTrackCount, noBudgetCount };
  }, [filteredProjects]);

  const handleSort = (field: 'name' | 'budget' | 'forecast' | 'variance') => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) <= 10) return 'text-green-600 bg-green-50';
    if (variance > 10) return 'text-red-600 bg-red-50';
    return 'text-amber-600 bg-amber-50';
  };

  const getVarianceIcon = (variance: number) => {
    if (Math.abs(variance) <= 10) return '✓';
    if (variance > 0) return '▲';
    return '▼';
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-emerald-600 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const isLoading = summaryLoading || projectsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600 mt-1">Track and manage project budgets vs forecasts</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Budget</div>
          <div className="text-xl font-bold text-gray-900">{stats.totalBudget.toLocaleString()} hrs</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Forecast</div>
          <div className="text-xl font-bold text-emerald-600">{stats.totalForecast.toLocaleString()} hrs</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">On Track</div>
          <div className="text-xl font-bold text-green-600">{stats.onTrackCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Over Budget</div>
          <div className="text-xl font-bold text-red-600">{stats.overBudgetCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Under Budget</div>
          <div className="text-xl font-bold text-amber-600">{stats.underBudgetCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">No Budget Set</div>
          <div className="text-xl font-bold text-gray-500">{stats.noBudgetCount}</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Project <SortIcon field="name" />
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignments
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('budget')}
                >
                  Budget (hrs) <SortIcon field="budget" />
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('forecast')}
                >
                  Forecast (hrs) <SortIcon field="forecast" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('variance')}
                >
                  Variance <SortIcon field="variance" />
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/forecast/projects/${project.id}`}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        {project.name}
                      </Link>
                      {project.programCode && (
                        <div className="text-xs text-gray-500">{project.programCode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {project.assignmentCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {project.budgetedHours ? project.budgetedHours.toLocaleString() : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-emerald-600">
                      {project.forecastedHours.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {project.budgetedHours ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getVarianceColor(project.variance)}`}>
                          {getVarianceIcon(project.variance)} {project.variance > 0 ? '+' : ''}{project.variance.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No budget</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/forecast/projects/${project.id}/grid`}
                        className="text-gray-400 hover:text-emerald-600"
                        title="View Grid"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></span>
          On Track (±10%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></span>
          Over Budget ({'>'}10%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></span>
          Under Budget ({'<'}-10%)
        </span>
      </div>
    </div>
  );
}

export default BudgetManagementPage;
