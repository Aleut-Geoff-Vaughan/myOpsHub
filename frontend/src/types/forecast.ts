// Forecast-related Type Definitions

// Non-Labor Cost Category enum matching backend
export enum NonLaborCostCategory {
  Travel = 0,
  Meals = 1,
  Equipment = 2,
  Supplies = 3,
  Subcontracts = 4,
  Training = 5,
  Communications = 6,
  Facilities = 7,
  Other = 99,
}

// Cost Rate Source enum
export enum CostRateSource {
  ManualEntry = 0,
  CsvImport = 1,
  ExcelImport = 2,
  BulkAdjustment = 3,
}

// Cost Rate Import Status enum
export enum CostRateImportStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  CompletedWithErrors = 3,
  Failed = 4,
}

// Forecast Status enum
export enum ForecastStatus {
  Draft = 0,
  PendingApproval = 1,
  Approved = 2,
  Rejected = 3,
}

// Non-Labor Cost Type
export interface NonLaborCostType {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  category: NonLaborCostCategory;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}

// Non-Labor Forecast
export interface NonLaborForecast {
  id: string;
  tenantId: string;
  projectId: string;
  wbsElementId?: string;
  nonLaborCostTypeId: string;
  forecastVersionId?: string;
  year: number;
  month: number;
  forecastedAmount: number;
  notes?: string;
  status: ForecastStatus;
  submittedByUserId?: string;
  submittedAt?: string;
  approvedByUserId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
  // Navigation properties
  nonLaborCostType?: NonLaborCostType;
  project?: { id: string; name: string };
}

// Non-Labor Budget Line
export interface NonLaborBudgetLine {
  id: string;
  tenantId: string;
  projectBudgetId: string;
  nonLaborCostTypeId: string;
  wbsElementId?: string;
  year: number;
  month: number;
  budgetedAmount: number;
  createdAt: string;
  updatedAt?: string;
  // Navigation properties
  nonLaborCostType?: NonLaborCostType;
}

// Employee Cost Rate
export interface EmployeeCostRate {
  id: string;
  tenantId: string;
  userId: string;
  effectiveDate: string;
  endDate?: string;
  loadedCostRate: number;
  notes?: string;
  source: CostRateSource;
  importBatchId?: string;
  createdAt: string;
  updatedAt?: string;
  // DTO properties
  userDisplayName?: string;
  userEmail?: string;
}

// Cost Rate Import Batch
export interface CostRateImportBatch {
  id: string;
  tenantId: string;
  fileName: string;
  fileType: string;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  status: CostRateImportStatus;
  errorDetails?: string;
  completedAt?: string;
  importedByUserId?: string;
  importedAt?: string;
  createdAt: string;
  updatedAt?: string;
  // Navigation properties
  importedByUser?: { id: string; displayName: string };
}

// Working Days calculation result
export interface MonthWorkingDays {
  year: number;
  month: number;
  totalDays: number;
  businessDays: number;
  weekends: number;
  holidays: number;
  ptoDays: number;
  netWorkingDays: number;
  availableHours: number;
}

// Request DTOs
export interface CreateCostTypeRequest {
  name: string;
  code?: string;
  description?: string;
  category: NonLaborCostCategory;
  sortOrder?: number;
}

export interface UpdateCostTypeRequest {
  name?: string;
  code?: string;
  description?: string;
  category?: NonLaborCostCategory;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpsertNonLaborForecastRequest {
  projectId: string;
  costTypeId: string;
  year: number;
  month: number;
  amount: number;
  notes?: string;
}

export interface UpsertBudgetLineRequest {
  budgetId: string;
  costTypeId: string;
  year: number;
  month: number;
  budgetedAmount: number;
}

export interface CreateCostRateRequest {
  userId: string;
  effectiveDate: string;
  endDate?: string;
  loadedCostRate: number;
  notes?: string;
}

export interface UpdateCostRateRequest {
  effectiveDate?: string;
  endDate?: string;
  loadedCostRate?: number;
  notes?: string;
}

export interface ImportResultDto {
  batchId: string;
  fileName: string;
  successCount: number;
  failedCount: number;
  errors: string[];
}

// Helper functions
export function getCostCategoryLabel(category: NonLaborCostCategory): string {
  const labels: Record<NonLaborCostCategory, string> = {
    [NonLaborCostCategory.Travel]: 'Travel',
    [NonLaborCostCategory.Meals]: 'Meals',
    [NonLaborCostCategory.Equipment]: 'Equipment',
    [NonLaborCostCategory.Supplies]: 'Supplies',
    [NonLaborCostCategory.Subcontracts]: 'Subcontracts',
    [NonLaborCostCategory.Training]: 'Training',
    [NonLaborCostCategory.Communications]: 'Communications',
    [NonLaborCostCategory.Facilities]: 'Facilities',
    [NonLaborCostCategory.Other]: 'Other',
  };
  return labels[category] || 'Unknown';
}

export function getCostRateSourceLabel(source: CostRateSource): string {
  const labels: Record<CostRateSource, string> = {
    [CostRateSource.ManualEntry]: 'Manual Entry',
    [CostRateSource.CsvImport]: 'CSV Import',
    [CostRateSource.ExcelImport]: 'Excel Import',
    [CostRateSource.BulkAdjustment]: 'Bulk Adjustment',
  };
  return labels[source] || 'Unknown';
}

export function getImportStatusLabel(status: CostRateImportStatus): string {
  const labels: Record<CostRateImportStatus, string> = {
    [CostRateImportStatus.Pending]: 'Pending',
    [CostRateImportStatus.Processing]: 'Processing',
    [CostRateImportStatus.Completed]: 'Completed',
    [CostRateImportStatus.CompletedWithErrors]: 'Completed with Errors',
    [CostRateImportStatus.Failed]: 'Failed',
  };
  return labels[status] || 'Unknown';
}
