import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { CustomFieldsSection } from '../../components/salesops/CustomFieldRenderer';
import {
  useOpportunity,
  useCreateOpportunity,
  useUpdateOpportunity,
  useStages,
  useAccounts,
  useBiddingEntities,
  usePicklistValues,
} from '../../hooks/useSalesOps';
import {
  OpportunityType,
  GrowthType,
  BidDecision,
  type CreateOpportunityDto,
  type UpdateOpportunityDto,
} from '../../services/salesOpsService';
import toast from 'react-hot-toast';

// Enum options for selects
const opportunityTypeOptions = [
  { value: OpportunityType.NewBusiness, label: 'New Business' },
  { value: OpportunityType.Recompete, label: 'Recompete' },
  { value: OpportunityType.TaskOrder, label: 'Task Order' },
  { value: OpportunityType.Modification, label: 'Modification' },
  { value: OpportunityType.Option, label: 'Option' },
];

const growthTypeOptions = [
  { value: GrowthType.NewBusiness, label: 'New Business' },
  { value: GrowthType.Expansion, label: 'Expansion' },
  { value: GrowthType.Renewal, label: 'Renewal' },
];

// acquisitionTypeOptions - now fetched dynamically via usePicklistValues('AcquisitionType')
// contractTypeOptions - now fetched dynamically via usePicklistValues('ContractType')

const bidDecisionOptions = [
  { value: BidDecision.Pending, label: 'Pending' },
  { value: BidDecision.Bid, label: 'Bid' },
  { value: BidDecision.NoBid, label: 'No Bid' },
  { value: BidDecision.ConditionalBid, label: 'Conditional Bid' },
];

// Form field components
interface InputFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

function InputField({ label, name, value, onChange, type = 'text', required, placeholder, min, max, step }: InputFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
  placeholder?: string;
}

function SelectField({ label, name, value, onChange, options, required, placeholder }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
}

function TextAreaField({ label, name, value, onChange, rows = 3, placeholder }: TextAreaFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function CheckboxField({ label, name, checked, onChange }: CheckboxFieldProps) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
      />
      <label htmlFor={name} className="ml-2 text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
}

// Section wrapper component
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Initial form state
interface FormData {
  name: string;
  description: string;
  accountId: string;
  biddingEntityId: string;
  stageId: string;
  type: OpportunityType;
  growthType: GrowthType;
  acquisitionType: string;
  contractType: string;
  bidDecision: BidDecision;
  opportunityStatus: string;
  portfolio: string;
  amount: number;
  totalContractValue: number;
  probabilityPercent: number;
  closeDate: string;
  closeFiscalYear: string;
  closeFiscalQuarter: string;
  includedInForecast: boolean;
  // Key dates
  plannedRfiSubmissionDate: string;
  actualRfiSubmissionDate: string;
  plannedRfpReleaseDate: string;
  actualRfpReleaseDate: string;
  plannedProposalSubmissionDate: string;
  actualProposalSubmissionDate: string;
  projectStartDate: string;
  projectFinishDate: string;
  durationMonths: number;
  // Contract details
  solicitationNumber: string;
  primaryNaicsCode: string;
  proposalId: string;
  isDirectAward: boolean;
  isFrontDoor: boolean;
  incumbent: string;
  incumbentContractNumber: string;
  placeOfPerformance: string;
  // Strategy
  priority: string;
  nextStep: string;
  primaryBusinessLine: string;
  capability: string;
  // Lead source
  leadSource: string;
  govWinId: string;
  bAndPCode: string;
  opportunityLink: string;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  accountId: '',
  biddingEntityId: '',
  stageId: '',
  type: OpportunityType.NewBusiness,
  growthType: GrowthType.NewBusiness,
  acquisitionType: '',
  contractType: '',
  bidDecision: BidDecision.Pending,
  opportunityStatus: '',
  portfolio: '',
  amount: 0,
  totalContractValue: 0,
  probabilityPercent: 10,
  closeDate: '',
  closeFiscalYear: '',
  closeFiscalQuarter: '',
  includedInForecast: false,
  plannedRfiSubmissionDate: '',
  actualRfiSubmissionDate: '',
  plannedRfpReleaseDate: '',
  actualRfpReleaseDate: '',
  plannedProposalSubmissionDate: '',
  actualProposalSubmissionDate: '',
  projectStartDate: '',
  projectFinishDate: '',
  durationMonths: 0,
  solicitationNumber: '',
  primaryNaicsCode: '',
  proposalId: '',
  isDirectAward: false,
  isFrontDoor: false,
  incumbent: '',
  incumbentContractNumber: '',
  placeOfPerformance: '',
  priority: '',
  nextStep: '',
  primaryBusinessLine: '',
  capability: '',
  leadSource: '',
  govWinId: '',
  bAndPCode: '',
  opportunityLink: '',
};

export function SalesOpsOpportunityFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Fetch existing opportunity if editing
  const { data: opportunity, isLoading: opportunityLoading } = useOpportunity(id);

  // Fetch reference data
  const { data: stages, isLoading: stagesLoading } = useStages();
  const { data: accounts } = useAccounts();
  const { data: biddingEntities } = useBiddingEntities();

  // Fetch dynamic picklists
  const { data: acquisitionTypePicklist } = usePicklistValues('AcquisitionType');
  const { data: contractTypePicklist } = usePicklistValues('ContractType');
  const { data: opportunityStatusPicklist } = usePicklistValues('OpportunityStatus');
  const { data: portfolioPicklist } = usePicklistValues('Portfolio');

  // Mutations
  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Get stageId from URL query params for new opportunities
  const defaultStageId = searchParams.get('stageId');

  // Populate form when editing or when stages load
  useEffect(() => {
    if (isEditMode && opportunity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: opportunity.name,
        description: opportunity.description || '',
        accountId: opportunity.accountId || '',
        biddingEntityId: opportunity.biddingEntityId || '',
        stageId: opportunity.stageId,
        type: opportunity.type,
        growthType: opportunity.growthType,
        acquisitionType: opportunity.acquisitionType || '',
        contractType: opportunity.contractType || '',
        bidDecision: opportunity.bidDecision,
        opportunityStatus: opportunity.opportunityStatus || '',
        portfolio: opportunity.portfolio || '',
        amount: opportunity.amount,
        totalContractValue: opportunity.totalContractValue,
        probabilityPercent: opportunity.probabilityPercent,
        closeDate: opportunity.closeDate ? opportunity.closeDate.split('T')[0] : '',
        closeFiscalYear: opportunity.closeFiscalYear || '',
        closeFiscalQuarter: opportunity.closeFiscalQuarter || '',
        includedInForecast: opportunity.includedInForecast,
        plannedRfiSubmissionDate: opportunity.plannedRfiSubmissionDate?.split('T')[0] || '',
        actualRfiSubmissionDate: opportunity.actualRfiSubmissionDate?.split('T')[0] || '',
        plannedRfpReleaseDate: opportunity.plannedRfpReleaseDate?.split('T')[0] || '',
        actualRfpReleaseDate: opportunity.actualRfpReleaseDate?.split('T')[0] || '',
        plannedProposalSubmissionDate: opportunity.plannedProposalSubmissionDate?.split('T')[0] || '',
        actualProposalSubmissionDate: opportunity.actualProposalSubmissionDate?.split('T')[0] || '',
        projectStartDate: opportunity.projectStartDate?.split('T')[0] || '',
        projectFinishDate: opportunity.projectFinishDate?.split('T')[0] || '',
        durationMonths: opportunity.durationMonths || 0,
        solicitationNumber: opportunity.solicitationNumber || '',
        primaryNaicsCode: opportunity.primaryNaicsCode || '',
        proposalId: opportunity.proposalId || '',
        isDirectAward: opportunity.isDirectAward,
        isFrontDoor: opportunity.isFrontDoor,
        incumbent: opportunity.incumbent || '',
        incumbentContractNumber: opportunity.incumbentContractNumber || '',
        placeOfPerformance: opportunity.placeOfPerformance || '',
        priority: opportunity.priority || '',
        nextStep: opportunity.nextStep || '',
        primaryBusinessLine: opportunity.primaryBusinessLine || '',
        capability: opportunity.capability || '',
        leadSource: opportunity.leadSource || '',
        govWinId: opportunity.govWinId || '',
        bAndPCode: opportunity.bAndPCode || '',
        opportunityLink: opportunity.opportunityLink || '',
      });
    } else if (!isEditMode && stages && stages.length > 0) {
      // Set default stage for new opportunities
      const selectedStage = defaultStageId
        ? stages.find((s) => s.id === defaultStageId)
        : stages.find((s) => s.isActive);
      if (selectedStage) {
        setFormData((prev) => ({
          ...prev,
          stageId: selectedStage.id,
          probabilityPercent: selectedStage.defaultProbability,
        }));
      }
    }
  }, [isEditMode, opportunity, stages, defaultStageId]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));

    // Update probability when stage changes
    if (name === 'stageId' && stages) {
      const selectedStage = stages.find((s) => s.id === value);
      if (selectedStage) {
        setFormData((prev) => ({
          ...prev,
          stageId: value,
          probabilityPercent: selectedStage.defaultProbability,
        }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Opportunity name is required');
      return;
    }

    if (!formData.stageId) {
      toast.error('Stage is required');
      return;
    }

    if (!formData.closeDate) {
      toast.error('Close date is required');
      return;
    }

    try {
      if (isEditMode) {
        const updateData: UpdateOpportunityDto = {
          name: formData.name,
          description: formData.description || undefined,
          accountId: formData.accountId || undefined,
          biddingEntityId: formData.biddingEntityId || undefined,
          stageId: formData.stageId,
          type: formData.type,
          growthType: formData.growthType,
          acquisitionType: formData.acquisitionType || undefined,
          contractType: formData.contractType || undefined,
          opportunityStatus: formData.opportunityStatus || undefined,
          portfolio: formData.portfolio || undefined,
          amount: formData.amount,
          totalContractValue: formData.totalContractValue,
          probabilityPercent: formData.probabilityPercent,
          closeDate: formData.closeDate,
          closeFiscalYear: formData.closeFiscalYear || undefined,
          closeFiscalQuarter: formData.closeFiscalQuarter || undefined,
          includedInForecast: formData.includedInForecast,
        };

        await updateMutation.mutateAsync({ id: id!, data: updateData });
        toast.success('Opportunity updated successfully');
        navigate(`/salesops/opportunities/${id}`);
      } else {
        const createData: CreateOpportunityDto = {
          name: formData.name,
          description: formData.description || undefined,
          accountId: formData.accountId || undefined,
          biddingEntityId: formData.biddingEntityId || undefined,
          stageId: formData.stageId,
          type: formData.type,
          growthType: formData.growthType,
          acquisitionType: formData.acquisitionType || undefined,
          contractType: formData.contractType || undefined,
          opportunityStatus: formData.opportunityStatus || undefined,
          portfolio: formData.portfolio || undefined,
          amount: formData.amount,
          totalContractValue: formData.totalContractValue || undefined,
          probabilityPercent: formData.probabilityPercent,
          closeDate: formData.closeDate,
          closeFiscalYear: formData.closeFiscalYear || undefined,
          closeFiscalQuarter: formData.closeFiscalQuarter || undefined,
          includedInForecast: formData.includedInForecast,
        };

        const newOpportunity = await createMutation.mutateAsync(createData);
        toast.success('Opportunity created successfully');
        navigate(`/salesops/opportunities/${newOpportunity.id}`);
      }
    } catch {
      toast.error(isEditMode ? 'Failed to update opportunity' : 'Failed to create opportunity');
    }
  };

  const isLoading = opportunityLoading || stagesLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Build options for select fields
  const stageOptions = (stages || [])
    .filter((s) => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({ value: s.id, label: s.name }));

  const accountOptions = (accounts || [])
    .filter((a) => a.isActive)
    .map((a) => ({ value: a.id, label: a.name }));

  const entityOptions = (biddingEntities || [])
    .filter((e) => e.isActive)
    .map((e) => ({ value: e.id, label: e.name }));

  const fiscalQuarterOptions = [
    { value: 'Q1', label: 'Q1' },
    { value: 'Q2', label: 'Q2' },
    { value: 'Q3', label: 'Q3' },
    { value: 'Q4', label: 'Q4' },
  ];

  const priorityOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];

  // Dynamic picklist options
  const acquisitionTypeOptions = (acquisitionTypePicklist || [])
    .filter((v) => v.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => ({ value: v.value, label: v.label }));

  const contractTypeOptions = (contractTypePicklist || [])
    .filter((v) => v.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => ({ value: v.value, label: v.label }));

  const opportunityStatusOptions = (opportunityStatusPicklist || [])
    .filter((v) => v.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => ({ value: v.value, label: v.label }));

  const portfolioOptions = (portfolioPicklist || [])
    .filter((v) => v.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => ({ value: v.value, label: v.label }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={isEditMode ? `/salesops/opportunities/${id}` : '/salesops/opportunities'}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {isEditMode ? 'Back to Opportunity' : 'Back to Opportunities'}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Opportunity' : 'New Opportunity'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormSection title="Basic Information">
          <div className="lg:col-span-2">
            <InputField
              label="Opportunity Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter opportunity name"
            />
          </div>
          <SelectField
            label="Stage"
            name="stageId"
            value={formData.stageId}
            onChange={handleChange}
            options={stageOptions}
            required
            placeholder="Select stage"
          />
          <SelectField
            label="Account"
            name="accountId"
            value={formData.accountId}
            onChange={handleChange}
            options={accountOptions}
            placeholder="Select account"
          />
          <SelectField
            label="Bidding Entity"
            name="biddingEntityId"
            value={formData.biddingEntityId}
            onChange={handleChange}
            options={entityOptions}
            placeholder="Select bidding entity"
          />
          <div className="lg:col-span-3">
            <TextAreaField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter opportunity description"
            />
          </div>
        </FormSection>

        {/* Classification */}
        <FormSection title="Classification">
          <SelectField
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={opportunityTypeOptions}
          />
          <SelectField
            label="Growth Type"
            name="growthType"
            value={formData.growthType}
            onChange={handleChange}
            options={growthTypeOptions}
          />
          <SelectField
            label="Opportunity Status"
            name="opportunityStatus"
            value={formData.opportunityStatus}
            onChange={handleChange}
            options={opportunityStatusOptions}
            placeholder="Select status"
          />
          <SelectField
            label="Acquisition Type"
            name="acquisitionType"
            value={formData.acquisitionType}
            onChange={handleChange}
            options={acquisitionTypeOptions}
            placeholder="Select acquisition type"
          />
          <SelectField
            label="Contract Type"
            name="contractType"
            value={formData.contractType}
            onChange={handleChange}
            options={contractTypeOptions}
            placeholder="Select contract type"
          />
          <SelectField
            label="Portfolio"
            name="portfolio"
            value={formData.portfolio}
            onChange={handleChange}
            options={portfolioOptions}
            placeholder="Select portfolio"
          />
          <SelectField
            label="Bid Decision"
            name="bidDecision"
            value={formData.bidDecision}
            onChange={handleChange}
            options={bidDecisionOptions}
          />
          <SelectField
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={priorityOptions}
            placeholder="Select priority"
          />
        </FormSection>

        {/* Financial Information */}
        <FormSection title="Financial Information">
          <InputField
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            min={0}
            step={1000}
          />
          <InputField
            label="Total Contract Value"
            name="totalContractValue"
            type="number"
            value={formData.totalContractValue}
            onChange={handleChange}
            min={0}
            step={1000}
          />
          <InputField
            label="Probability %"
            name="probabilityPercent"
            type="number"
            value={formData.probabilityPercent}
            onChange={handleChange}
            min={0}
            max={100}
          />
          <div className="flex items-end">
            <CheckboxField
              label="Include in Forecast"
              name="includedInForecast"
              checked={formData.includedInForecast}
              onChange={handleChange}
            />
          </div>
        </FormSection>

        {/* Key Dates */}
        <FormSection title="Key Dates">
          <InputField
            label="Close Date"
            name="closeDate"
            type="date"
            value={formData.closeDate}
            onChange={handleChange}
            required
          />
          <InputField
            label="Close Fiscal Year"
            name="closeFiscalYear"
            value={formData.closeFiscalYear}
            onChange={handleChange}
            placeholder="e.g., FY25"
          />
          <SelectField
            label="Close Fiscal Quarter"
            name="closeFiscalQuarter"
            value={formData.closeFiscalQuarter}
            onChange={handleChange}
            options={fiscalQuarterOptions}
            placeholder="Select quarter"
          />
          <InputField
            label="Planned RFI Submission"
            name="plannedRfiSubmissionDate"
            type="date"
            value={formData.plannedRfiSubmissionDate}
            onChange={handleChange}
          />
          <InputField
            label="Actual RFI Submission"
            name="actualRfiSubmissionDate"
            type="date"
            value={formData.actualRfiSubmissionDate}
            onChange={handleChange}
          />
          <InputField
            label="Planned RFP Release"
            name="plannedRfpReleaseDate"
            type="date"
            value={formData.plannedRfpReleaseDate}
            onChange={handleChange}
          />
          <InputField
            label="Actual RFP Release"
            name="actualRfpReleaseDate"
            type="date"
            value={formData.actualRfpReleaseDate}
            onChange={handleChange}
          />
          <InputField
            label="Planned Proposal Submission"
            name="plannedProposalSubmissionDate"
            type="date"
            value={formData.plannedProposalSubmissionDate}
            onChange={handleChange}
          />
          <InputField
            label="Actual Proposal Submission"
            name="actualProposalSubmissionDate"
            type="date"
            value={formData.actualProposalSubmissionDate}
            onChange={handleChange}
          />
          <InputField
            label="Project Start Date"
            name="projectStartDate"
            type="date"
            value={formData.projectStartDate}
            onChange={handleChange}
          />
          <InputField
            label="Project Finish Date"
            name="projectFinishDate"
            type="date"
            value={formData.projectFinishDate}
            onChange={handleChange}
          />
          <InputField
            label="Duration (Months)"
            name="durationMonths"
            type="number"
            value={formData.durationMonths}
            onChange={handleChange}
            min={0}
          />
        </FormSection>

        {/* Contract Details */}
        <FormSection title="Contract Details">
          <InputField
            label="Solicitation Number"
            name="solicitationNumber"
            value={formData.solicitationNumber}
            onChange={handleChange}
            placeholder="Enter solicitation number"
          />
          <InputField
            label="Primary NAICS Code"
            name="primaryNaicsCode"
            value={formData.primaryNaicsCode}
            onChange={handleChange}
            placeholder="e.g., 541512"
          />
          <InputField
            label="Proposal ID"
            name="proposalId"
            value={formData.proposalId}
            onChange={handleChange}
            placeholder="Enter proposal ID"
          />
          <InputField
            label="Incumbent"
            name="incumbent"
            value={formData.incumbent}
            onChange={handleChange}
            placeholder="Current contract holder"
          />
          <InputField
            label="Incumbent Contract Number"
            name="incumbentContractNumber"
            value={formData.incumbentContractNumber}
            onChange={handleChange}
            placeholder="Current contract number"
          />
          <InputField
            label="Place of Performance"
            name="placeOfPerformance"
            value={formData.placeOfPerformance}
            onChange={handleChange}
            placeholder="e.g., Washington, DC"
          />
          <div className="flex items-end gap-6">
            <CheckboxField
              label="Direct Award"
              name="isDirectAward"
              checked={formData.isDirectAward}
              onChange={handleChange}
            />
            <CheckboxField
              label="Front Door"
              name="isFrontDoor"
              checked={formData.isFrontDoor}
              onChange={handleChange}
            />
          </div>
        </FormSection>

        {/* Strategy */}
        <FormSection title="Strategy & Next Steps">
          <div className="lg:col-span-3">
            <TextAreaField
              label="Next Step"
              name="nextStep"
              value={formData.nextStep}
              onChange={handleChange}
              rows={2}
              placeholder="What's the next action item?"
            />
          </div>
          <InputField
            label="Primary Business Line"
            name="primaryBusinessLine"
            value={formData.primaryBusinessLine}
            onChange={handleChange}
            placeholder="Enter business line"
          />
          <InputField
            label="Capability"
            name="capability"
            value={formData.capability}
            onChange={handleChange}
            placeholder="Enter capability"
          />
        </FormSection>

        {/* Lead Source */}
        <FormSection title="Lead Source & References">
          <InputField
            label="Lead Source"
            name="leadSource"
            value={formData.leadSource}
            onChange={handleChange}
            placeholder="e.g., GovWin, SAM.gov, Referral"
          />
          <InputField
            label="GovWin ID"
            name="govWinId"
            value={formData.govWinId}
            onChange={handleChange}
            placeholder="GovWin opportunity ID"
          />
          <InputField
            label="B&P Code"
            name="bAndPCode"
            value={formData.bAndPCode}
            onChange={handleChange}
            placeholder="B&P tracking code"
          />
          <div className="lg:col-span-3">
            <InputField
              label="Opportunity Link"
              name="opportunityLink"
              type="url"
              value={formData.opportunityLink}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
        </FormSection>

        {/* Custom Fields (only shown when editing existing opportunity) */}
        {isEditMode && id && (
          <CustomFieldsSection
            entityType="Opportunity"
            entityId={id}
            mode="edit"
          />
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Link
            to={isEditMode ? `/salesops/opportunities/${id}` : '/salesops/opportunities'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : isEditMode ? 'Update Opportunity' : 'Create Opportunity'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalesOpsOpportunityFormPage;
