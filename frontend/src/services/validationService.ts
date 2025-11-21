import axios from 'axios';
import type {
  ValidationRule,
  ValidationResult,
  ValidateEntityRequest,
  ValidateFieldRequest,
  ValidateExpressionRequest,
  ExpressionValidationResult,
  RuleOrderUpdate,
  SetActiveRequest,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const validationService = {
  // ==================== VALIDATION RULES CRUD ====================

  /**
   * Get all validation rules with optional filtering
   */
  async getRules(params: {
    tenantId: string;
    entityType?: string;
    fieldName?: string;
    isActive?: boolean;
  }): Promise<ValidationRule[]> {
    const response = await axios.get(`${API_BASE_URL}/api/validation/rules`, { params });
    return response.data;
  },

  /**
   * Get a specific validation rule by ID
   */
  async getRuleById(id: string, tenantId: string): Promise<ValidationRule> {
    const response = await axios.get(`${API_BASE_URL}/api/validation/rules/${id}`, {
      params: { tenantId },
    });
    return response.data;
  },

  /**
   * Create a new validation rule
   */
  async createRule(
    tenantId: string,
    rule: Omit<ValidationRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ValidationRule> {
    const response = await axios.post(
      `${API_BASE_URL}/api/validation/rules`,
      rule,
      { params: { tenantId } }
    );
    return response.data;
  },

  /**
   * Update an existing validation rule
   */
  async updateRule(id: string, tenantId: string, rule: ValidationRule): Promise<void> {
    await axios.put(
      `${API_BASE_URL}/api/validation/rules/${id}`,
      rule,
      { params: { tenantId } }
    );
  },

  /**
   * Delete a validation rule
   */
  async deleteRule(id: string, tenantId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/validation/rules/${id}`, {
      params: { tenantId },
    });
  },

  /**
   * Activate or deactivate a validation rule
   */
  async setRuleActive(id: string, tenantId: string, isActive: boolean): Promise<void> {
    await axios.patch(
      `${API_BASE_URL}/api/validation/rules/${id}/active`,
      { isActive } as SetActiveRequest,
      { params: { tenantId } }
    );
  },

  // ==================== VALIDATION OPERATIONS ====================

  /**
   * Validate entity data against all applicable rules
   */
  async validateEntity(tenantId: string, request: ValidateEntityRequest): Promise<ValidationResult> {
    const response = await axios.post(
      `${API_BASE_URL}/api/validation/validate`,
      request,
      { params: { tenantId } }
    );
    return response.data;
  },

  /**
   * Validate a specific field value
   */
  async validateField(tenantId: string, request: ValidateFieldRequest): Promise<ValidationResult> {
    const response = await axios.post(
      `${API_BASE_URL}/api/validation/validate-field`,
      request,
      { params: { tenantId } }
    );
    return response.data;
  },

  /**
   * Test a validation rule against sample data
   */
  async testRule(id: string, tenantId: string, testData: Record<string, any>): Promise<ValidationResult> {
    const response = await axios.post(
      `${API_BASE_URL}/api/validation/rules/${id}/test`,
      testData,
      { params: { tenantId } }
    );
    return response.data;
  },

  /**
   * Get all rules for a specific entity type
   */
  async getRulesForEntity(entityType: string, tenantId: string): Promise<ValidationRule[]> {
    const response = await axios.get(
      `${API_BASE_URL}/api/validation/rules/entity/${entityType}`,
      { params: { tenantId } }
    );
    return response.data;
  },

  /**
   * Get available entity types that have validation rules
   */
  async getEntityTypes(tenantId: string): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/api/validation/entity-types`, {
      params: { tenantId },
    });
    return response.data;
  },

  /**
   * Validate a rule expression for correctness
   */
  async validateExpression(request: ValidateExpressionRequest): Promise<ExpressionValidationResult> {
    const response = await axios.post(
      `${API_BASE_URL}/api/validation/validate-expression`,
      request
    );
    return response.data;
  },

  /**
   * Bulk update rule execution orders
   */
  async reorderRules(tenantId: string, updates: RuleOrderUpdate[]): Promise<void> {
    await axios.patch(
      `${API_BASE_URL}/api/validation/rules/reorder`,
      updates,
      { params: { tenantId } }
    );
  },
};
