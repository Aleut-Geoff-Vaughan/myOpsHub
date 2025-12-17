import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  User,
  Building2,
  FileText,
  Target,
  Award,
  AlertCircle,
  ExternalLink,
  Clock,
  Briefcase,
} from 'lucide-react';
import { useOpportunity, useDeleteOpportunity } from '../../hooks/useSalesOps';
import { CustomFieldsSection } from '../../components/salesops/CustomFieldRenderer';
import {
  OpportunityType,
  GrowthType,
  OpportunityResult,
  RfiStatus,
  BidDecision,
} from '../../services/salesOpsService';
import toast from 'react-hot-toast';

// Enum label helpers
const opportunityTypeLabels: Record<OpportunityType, string> = {
  [OpportunityType.NewBusiness]: 'New Business',
  [OpportunityType.Recompete]: 'Recompete',
  [OpportunityType.TaskOrder]: 'Task Order',
  [OpportunityType.Modification]: 'Modification',
  [OpportunityType.Option]: 'Option',
};

const growthTypeLabels: Record<GrowthType, string> = {
  [GrowthType.NewBusiness]: 'New Business',
  [GrowthType.Expansion]: 'Expansion',
  [GrowthType.Renewal]: 'Renewal',
};


const resultLabels: Record<OpportunityResult, string> = {
  [OpportunityResult.Won]: 'Won',
  [OpportunityResult.Lost]: 'Lost',
  [OpportunityResult.NoBid]: 'No Bid',
  [OpportunityResult.Cancelled]: 'Cancelled',
  [OpportunityResult.Withdrawn]: 'Withdrawn',
};

const rfiStatusLabels: Record<RfiStatus, string> = {
  [RfiStatus.NotApplicable]: 'Not Applicable',
  [RfiStatus.Pending]: 'Pending',
  [RfiStatus.Submitted]: 'Submitted',
  [RfiStatus.Responded]: 'Responded',
};

const bidDecisionLabels: Record<BidDecision, string> = {
  [BidDecision.Pending]: 'Pending',
  [BidDecision.Bid]: 'Bid',
  [BidDecision.NoBid]: 'No Bid',
  [BidDecision.ConditionalBid]: 'Conditional Bid',
};

// Format helpers
function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return `${value}%`;
}

function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Field display component
interface FieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

function Field({ label, value, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value || '-'}</div>
    </div>
  );
}

// Collapsible section component
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

// Result badge
function ResultBadge({ result }: { result?: OpportunityResult }) {
  if (result === undefined || result === null) return null;

  const colors: Record<OpportunityResult, string> = {
    [OpportunityResult.Won]: 'bg-emerald-100 text-emerald-800',
    [OpportunityResult.Lost]: 'bg-red-100 text-red-800',
    [OpportunityResult.NoBid]: 'bg-gray-100 text-gray-800',
    [OpportunityResult.Cancelled]: 'bg-amber-100 text-amber-800',
    [OpportunityResult.Withdrawn]: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[result]}`}>
      {resultLabels[result]}
    </span>
  );
}

export function SalesOpsOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: opportunity, isLoading, error } = useOpportunity(id);
  const deleteMutation = useDeleteOpportunity();

  const handleDelete = async () => {
    if (!opportunity) return;
    if (!confirm(`Are you sure you want to delete "${opportunity.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(opportunity.id);
      toast.success('Opportunity deleted successfully');
      navigate('/salesops/opportunities');
    } catch {
      toast.error('Failed to delete opportunity');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="space-y-4">
        <Link to="/salesops/opportunities" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Opportunities
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Opportunity not found or error loading data.</p>
        </div>
      </div>
    );
  }

  const isOverdue = new Date(opportunity.closeDate) < new Date() && !opportunity.result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link
            to="/salesops/opportunities"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Opportunities
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{opportunity.name}</h1>
            <ResultBadge result={opportunity.result} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
            <span className="font-mono text-xs sm:text-sm">{opportunity.opportunityNumber}</span>
            {opportunity.stage && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: opportunity.stage.color ? `${opportunity.stage.color}20` : '#f3f4f6',
                  color: opportunity.stage.color || '#374151',
                }}
              >
                {opportunity.stage.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/salesops/opportunities/${opportunity.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
          >
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Amount</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(opportunity.amount)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Contract Value</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(opportunity.totalContractValue)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Probability</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{formatPercent(opportunity.probabilityPercent)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Weighted Amount</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(opportunity.weightedAmount)}</div>
        </div>
      </div>

      {/* Close Date Alert */}
      {isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Close date has passed</p>
            <p className="text-sm text-red-700">
              This opportunity was expected to close on {formatDate(opportunity.closeDate)}. Please update the status or
              close date.
            </p>
          </div>
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opportunity Details Section */}
          <Section title="Opportunity Details" icon={<Target className="h-5 w-5 text-orange-600" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              <Field label="Opportunity Name" value={opportunity.name} />
              <Field label="Opportunity Number" value={opportunity.opportunityNumber} />
              <Field label="Stage" value={opportunity.stage?.name} />
              <Field label="Type" value={opportunityTypeLabels[opportunity.type]} />
              <Field label="Growth Type" value={growthTypeLabels[opportunity.growthType]} />
              <Field label="Acquisition Type" value={opportunity.acquisitionType} />
              <Field label="Contract Type" value={opportunity.contractType} />
              <Field label="Bid Decision" value={bidDecisionLabels[opportunity.bidDecision]} />
              <Field label="Priority" value={opportunity.priority} />
              <Field
                label="Description"
                value={opportunity.description}
                className="col-span-2 md:col-span-3"
              />
            </div>
          </Section>

          {/* Financial Details Section */}
          <Section title="Financial Details" icon={<DollarSign className="h-5 w-5 text-emerald-600" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              <Field label="Amount" value={formatCurrency(opportunity.amount)} />
              <Field label="Total Contract Value" value={formatCurrency(opportunity.totalContractValue)} />
              <Field label="Probability %" value={formatPercent(opportunity.probabilityPercent)} />
              <Field label="Probability Go %" value={formatPercent(opportunity.probabilityGoPercent)} />
              <Field label="Weighted Amount" value={formatCurrency(opportunity.weightedAmount)} />
              <Field label="Weighted TCV" value={formatCurrency(opportunity.weightedTcv)} />
              <Field label="Target Gross Margin %" value={formatPercent(opportunity.targetGrossMarginPercent)} />
              <Field label="Target GM Amount" value={formatCurrency(opportunity.targetGrossMarginAmount)} />
              <Field label="Target OI %" value={formatPercent(opportunity.targetOperatingIncomePercent)} />
              <Field label="Target OI Amount" value={formatCurrency(opportunity.targetOperatingIncomeAmount)} />
              <Field label="Revenue Stream" value={opportunity.revenueStream} />
              <Field
                label="Included in Forecast"
                value={opportunity.includedInForecast ? 'Yes' : 'No'}
              />
            </div>
          </Section>

          {/* Key Dates Section */}
          <Section title="Key Dates" icon={<Calendar className="h-5 w-5 text-blue-600" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              <Field
                label="Close Date"
                value={
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    {formatDate(opportunity.closeDate)}
                  </span>
                }
              />
              <Field label="Close Fiscal Year" value={opportunity.closeFiscalYear} />
              <Field label="Close Fiscal Quarter" value={opportunity.closeFiscalQuarter} />
              <Field label="RFI Status" value={rfiStatusLabels[opportunity.rfiStatus]} />
              <Field label="Planned RFI Submission" value={formatDate(opportunity.plannedRfiSubmissionDate)} />
              <Field label="Actual RFI Submission" value={formatDate(opportunity.actualRfiSubmissionDate)} />
              <Field label="Planned RFP Release" value={formatDate(opportunity.plannedRfpReleaseDate)} />
              <Field label="Actual RFP Release" value={formatDate(opportunity.actualRfpReleaseDate)} />
              <Field label="Planned Proposal Submission" value={formatDate(opportunity.plannedProposalSubmissionDate)} />
              <Field label="Actual Proposal Submission" value={formatDate(opportunity.actualProposalSubmissionDate)} />
              <Field label="Project Start Date" value={formatDate(opportunity.projectStartDate)} />
              <Field label="Project Finish Date" value={formatDate(opportunity.projectFinishDate)} />
              <Field label="Duration (Months)" value={opportunity.durationMonths} />
              <Field label="Opportunity Terms" value={opportunity.opportunityTerms} />
            </div>
          </Section>

          {/* Contract Details Section */}
          <Section title="Contract Details" icon={<FileText className="h-5 w-5 text-purple-600" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              <Field label="Solicitation Number" value={opportunity.solicitationNumber} />
              <Field label="Primary NAICS Code" value={opportunity.primaryNaicsCode} />
              <Field label="Costpoint Project Code" value={opportunity.costpointProjectCode} />
              <Field label="Proposal ID" value={opportunity.proposalId} />
              <Field label="Direct Award" value={opportunity.isDirectAward ? 'Yes' : 'No'} />
              <Field label="Front Door" value={opportunity.isFrontDoor ? 'Yes' : 'No'} />
              <Field label="Incumbent Contract Number" value={opportunity.incumbentContractNumber} />
              <Field label="Incumbent" value={opportunity.incumbent} />
              <Field label="Incumbent Award Date" value={formatDate(opportunity.incumbentAwardDate)} />
              <Field label="Incumbent Expire Date" value={formatDate(opportunity.incumbentExpireDate)} />
              <Field label="Master Contract Title" value={opportunity.masterContractTitle} />
              <Field label="Place of Performance" value={opportunity.placeOfPerformance} />
            </div>
          </Section>

          {/* Win/Loss Section (if closed) */}
          {opportunity.result !== undefined && opportunity.result !== null && (
            <Section title="Win/Loss Details" icon={<Award className="h-5 w-5 text-amber-600" />}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
                <Field label="Result" value={<ResultBadge result={opportunity.result} />} />
                <Field label="Loss Reason" value={opportunity.lossReason?.name} />
                <Field label="Winning Competitor" value={opportunity.winningCompetitor} />
                <Field label="Winning Price (TCV)" value={formatCurrency(opportunity.winningPriceTcv)} />
                <Field
                  label="Customer Feedback"
                  value={opportunity.customerFeedback}
                  className="col-span-2 md:col-span-3"
                />
              </div>
            </Section>
          )}

          {/* Strategy Section */}
          <Section title="Strategy & Next Steps" icon={<Briefcase className="h-5 w-5 text-cyan-600" />} defaultOpen={false}>
            <div className="space-y-4">
              <Field label="Next Step" value={opportunity.nextStep} />
              <Field label="Solution Details" value={opportunity.solutionDetails} />
              <Field label="Primary Business Line" value={opportunity.primaryBusinessLine} />
              <Field label="Capability" value={opportunity.capability} />
              <Field label="Capability Business Line" value={opportunity.capabilityBusinessLine} />
            </div>
          </Section>

          {/* Lead Source Section */}
          <Section title="Lead Source & References" icon={<ExternalLink className="h-5 w-5 text-indigo-600" />} defaultOpen={false}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              <Field label="Lead Source" value={opportunity.leadSource} />
              <Field label="GovWin ID" value={opportunity.govWinId} />
              <Field label="B&P Code" value={opportunity.bAndPCode} />
              <Field
                label="Opportunity Link"
                value={
                  opportunity.opportunityLink ? (
                    <a
                      href={opportunity.opportunityLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      View Link <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null
                }
              />
              <Field label="Response Folder" value={opportunity.responseFolder} />
            </div>
          </Section>

          {/* Custom Fields Section */}
          <CustomFieldsSection
            entityType="Opportunity"
            entityId={opportunity.id}
            mode="view"
          />
        </div>

        {/* Right Column - Related Info */}
        <div className="space-y-6">
          {/* Account Card */}
          <Section title="Account" icon={<Building2 className="h-5 w-5 text-gray-600" />}>
            {opportunity.account ? (
              <div className="space-y-3">
                <div>
                  <Link
                    to={`/salesops/accounts/${opportunity.account.id}`}
                    className="text-lg font-medium text-orange-600 hover:text-orange-700"
                  >
                    {opportunity.account.name}
                  </Link>
                  {opportunity.account.acronym && (
                    <span className="ml-2 text-sm text-gray-500">({opportunity.account.acronym})</span>
                  )}
                </div>
                {opportunity.account.federalDepartment && (
                  <p className="text-sm text-gray-600">{opportunity.account.federalDepartment}</p>
                )}
                {opportunity.account.website && (
                  <a
                    href={opportunity.account.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                  >
                    Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No account assigned</p>
            )}
          </Section>

          {/* Owner Card */}
          <Section title="Opportunity Owner" icon={<User className="h-5 w-5 text-gray-600" />}>
            {opportunity.owner ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {opportunity.owner.displayName || opportunity.owner.email}
                  </p>
                  <p className="text-sm text-gray-500">{opportunity.owner.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No owner assigned</p>
            )}
          </Section>

          {/* Bidding Entity Card */}
          <Section title="Bidding Entity" icon={<Building2 className="h-5 w-5 text-gray-600" />}>
            {opportunity.biddingEntity ? (
              <div className="space-y-3">
                <Link
                  to={`/salesops/entities/${opportunity.biddingEntity.id}`}
                  className="text-lg font-medium text-orange-600 hover:text-orange-700"
                >
                  {opportunity.biddingEntity.name}
                </Link>
                {opportunity.biddingEntity.is8a && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      8(a)
                    </span>
                    {opportunity.biddingEntity.daysUntilSbaExpiration !== undefined &&
                      opportunity.biddingEntity.daysUntilSbaExpiration !== null && (
                        <span
                          className={`text-xs ${
                            opportunity.biddingEntity.daysUntilSbaExpiration < 90
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          {opportunity.biddingEntity.daysUntilSbaExpiration} days until expiration
                        </span>
                      )}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {opportunity.biddingEntity.isSmallBusiness && (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">SB</span>
                  )}
                  {opportunity.biddingEntity.isSDVOSB && (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">SDVOSB</span>
                  )}
                  {opportunity.biddingEntity.isWOSB && (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">WOSB</span>
                  )}
                  {opportunity.biddingEntity.isHUBZone && (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">HUBZone</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No bidding entity assigned</p>
            )}
          </Section>

          {/* Contract Vehicle Card */}
          {opportunity.contractVehicle && (
            <Section title="Contract Vehicle" icon={<FileText className="h-5 w-5 text-gray-600" />}>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{opportunity.contractVehicle.name}</p>
                {opportunity.contractVehicle.contractNumber && (
                  <p className="text-sm text-gray-600">
                    Contract #: {opportunity.contractVehicle.contractNumber}
                  </p>
                )}
                {opportunity.contractVehicle.issuingAgency && (
                  <p className="text-sm text-gray-600">{opportunity.contractVehicle.issuingAgency}</p>
                )}
                {opportunity.contractVehicle.expirationDate && (
                  <p className="text-sm text-gray-500">
                    Expires: {formatDate(opportunity.contractVehicle.expirationDate)}
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* Primary Contact Card */}
          {opportunity.primaryContact && (
            <Section title="Primary Contact" icon={<User className="h-5 w-5 text-gray-600" />}>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{opportunity.primaryContact.fullName}</p>
                {opportunity.primaryContact.title && (
                  <p className="text-sm text-gray-600">{opportunity.primaryContact.title}</p>
                )}
                {opportunity.primaryContact.email && (
                  <a
                    href={`mailto:${opportunity.primaryContact.email}`}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    {opportunity.primaryContact.email}
                  </a>
                )}
                {opportunity.primaryContact.phone && (
                  <p className="text-sm text-gray-600">{opportunity.primaryContact.phone}</p>
                )}
              </div>
            </Section>
          )}

          {/* Audit Info */}
          <Section title="System Information" icon={<Clock className="h-5 w-5 text-gray-400" />} defaultOpen={false}>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500">Created</div>
                <div className="text-gray-900">{formatDateTime(opportunity.createdAt)}</div>
              </div>
              {opportunity.updatedAt && (
                <div>
                  <div className="text-gray-500">Last Modified</div>
                  <div className="text-gray-900">{formatDateTime(opportunity.updatedAt)}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500">Opportunity ID</div>
                <div className="text-gray-900 font-mono text-xs">{opportunity.id}</div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

export default SalesOpsOpportunityDetailPage;
