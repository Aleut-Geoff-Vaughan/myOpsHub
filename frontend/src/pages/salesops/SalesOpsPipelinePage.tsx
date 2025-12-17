import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Settings, DollarSign, Calendar, User, AlertCircle } from 'lucide-react';
import { useOpportunities, useStages, usePipelineSummary, useSeedDefaultStages } from '../../hooks/useSalesOps';
import { type OpportunityListDto, type SalesStage, type PipelineSummary } from '../../services/salesOpsService';
import toast from 'react-hot-toast';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

interface OpportunityCardProps {
  opportunity: OpportunityListDto;
  onClick: () => void;
}

function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  const isOverdue = new Date(opportunity.closeDate) < new Date();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:border-orange-300 transition-all"
    >
      <div className="font-medium text-gray-900 text-sm truncate mb-1">
        {opportunity.name}
      </div>
      <div className="text-xs text-gray-500 mb-2 truncate">
        {opportunity.accountName || 'No Account'}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-600">
          <DollarSign className="h-3 w-3" />
          <span className="font-medium">{formatCurrency(opportunity.amount)}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <span>{opportunity.probabilityPercent}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
          <Calendar className="h-3 w-3" />
          <span>{formatDate(opportunity.closeDate)}</span>
          {isOverdue && <AlertCircle className="h-3 w-3" />}
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <User className="h-3 w-3" />
          <span className="truncate max-w-[80px]">{opportunity.ownerName.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
}

interface StageColumnProps {
  stage: SalesStage;
  opportunities: OpportunityListDto[];
  summary?: PipelineSummary;
  onOpportunityClick: (id: string) => void;
}

function StageColumn({ stage, opportunities, summary, onOpportunityClick }: StageColumnProps) {
  const bgColor = stage.color ? `${stage.color}15` : '#f9fafb';

  return (
    <div
      className="w-72 flex-shrink-0 rounded-lg p-3"
      style={{ backgroundColor: bgColor }}
    >
      {/* Stage Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color || '#9ca3af' }}
          />
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
        </div>
        <span
          className="text-xs rounded-full px-2 py-0.5 font-medium"
          style={{
            backgroundColor: stage.color ? `${stage.color}30` : '#e5e7eb',
            color: stage.color || '#374151',
          }}
        >
          {opportunities.length}
        </span>
      </div>

      {/* Stage Summary */}
      {summary && summary.totalAmount > 0 && (
        <div
          className="text-xs mb-3 p-2 rounded"
          style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
        >
          <div className="flex justify-between">
            <span className="text-gray-600">Value:</span>
            <span className="font-medium">{formatCurrency(summary.totalAmount)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">Weighted:</span>
            <span className="font-medium">{formatCurrency(summary.weightedAmount)}</span>
          </div>
        </div>
      )}

      {/* Opportunities List */}
      <div className="space-y-2 min-h-[150px] max-h-[calc(100vh-400px)] overflow-y-auto">
        {opportunities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No opportunities
          </div>
        ) : (
          opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onClick={() => onOpportunityClick(opp.id)}
            />
          ))
        )}
      </div>

      {/* Add Button */}
      <Link
        to={`/salesops/opportunities/new?stageId=${stage.id}`}
        className="block w-full mt-2 py-2 text-sm text-center text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded transition-colors"
      >
        + Add Opportunity
      </Link>
    </div>
  );
}

export function SalesOpsPipelinePage() {
  const navigate = useNavigate();

  // Fetch data
  const { data: stages, isLoading: stagesLoading, error: stagesError } = useStages();
  const { data: opportunitiesData, isLoading: oppsLoading } = useOpportunities({ take: 500 });
  const { data: pipelineSummary } = usePipelineSummary();
  const seedMutation = useSeedDefaultStages();

  const opportunities = useMemo(() => opportunitiesData?.items || [], [opportunitiesData?.items]);

  // Group opportunities by stage
  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<string, OpportunityListDto[]> = {};
    stages?.forEach(stage => {
      grouped[stage.id] = [];
    });
    opportunities.forEach(opp => {
      if (grouped[opp.stageId]) {
        grouped[opp.stageId].push(opp);
      }
    });
    // Sort opportunities within each stage by close date
    Object.values(grouped).forEach(stageOpps => {
      stageOpps.sort((a, b) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime());
    });
    return grouped;
  }, [stages, opportunities]);

  // Get summary by stage ID
  const summaryByStage = useMemo(() => {
    const map: Record<string, PipelineSummary> = {};
    pipelineSummary?.forEach(s => {
      map[s.stageId] = s;
    });
    return map;
  }, [pipelineSummary]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      count: opportunities.length,
      value: opportunities.reduce((sum, o) => sum + o.amount, 0),
      weighted: opportunities.reduce((sum, o) => sum + o.weightedAmount, 0),
    };
  }, [opportunities]);

  const handleSeedStages = async () => {
    try {
      await seedMutation.mutateAsync();
      toast.success('Default stages created successfully');
    } catch {
      toast.error('Failed to create default stages');
    }
  };

  const isLoading = stagesLoading || oppsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (stagesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading pipeline stages. Please try again.</p>
      </div>
    );
  }

  // No stages yet - show setup prompt
  if (!stages || stages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Board</h1>
            <p className="mt-1 text-sm text-gray-500">
              Set up your sales pipeline to get started
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No pipeline stages configured</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            You need to set up your sales pipeline stages before you can start tracking opportunities.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleSeedStages}
              disabled={seedMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {seedMutation.isPending ? 'Creating...' : 'Create Default Stages'}
            </button>
            <Link
              to="/salesops/settings/stages"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Configure Manually
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Board</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totals.count} opportunities • {formatCurrency(totals.value)} total • {formatCurrency(totals.weighted)} weighted
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/salesops/settings/stages"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Settings className="h-4 w-4 sm:mr-2 text-gray-500" />
            <span className="hidden sm:inline">Configure Stages</span>
          </Link>
          <Link
            to="/salesops/opportunities/new"
            className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">New Opportunity</span>
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-max">
          {stages
            .filter(stage => stage.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                opportunities={opportunitiesByStage[stage.id] || []}
                summary={summaryByStage[stage.id]}
                onOpportunityClick={(id) => navigate(`/salesops/opportunities/${id}`)}
              />
            ))}
        </div>
      </div>

      {/* Info Banner - only show if no opportunities */}
      {opportunities.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Get Started:</strong> Click &quot;New Opportunity&quot; or the &quot;+ Add Opportunity&quot; button in any stage to create your first sales opportunity.
          </p>
        </div>
      )}
    </div>
  );
}

export default SalesOpsPipelinePage;
