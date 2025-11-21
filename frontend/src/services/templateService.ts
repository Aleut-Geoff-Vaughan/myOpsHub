import { api } from '../lib/api-client';
import type {
  WorkLocationTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ApplyTemplateRequest,
} from '../types/template';
import type { WorkLocationPreference } from '../types/api';

export const templateService = {
  /**
   * Get all templates (user's own + shared)
   */
  async getTemplates(): Promise<WorkLocationTemplate[]> {
    return api.get<WorkLocationTemplate[]>('/worklocationtemplates');
  },

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<WorkLocationTemplate> {
    return api.get<WorkLocationTemplate>(`/worklocationtemplates/${id}`);
  },

  /**
   * Create a new template
   */
  async createTemplate(request: CreateTemplateRequest): Promise<WorkLocationTemplate> {
    return api.post<WorkLocationTemplate>('/worklocationtemplates', request);
  },

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, request: UpdateTemplateRequest): Promise<void> {
    await api.put(`/worklocationtemplates/${id}`, request);
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/worklocationtemplates/${id}`);
  },

  /**
   * Apply a template to create work location preferences
   */
  async applyTemplate(
    id: string,
    request: ApplyTemplateRequest
  ): Promise<WorkLocationPreference[]> {
    return api.post<WorkLocationPreference[]>(
      `/worklocationtemplates/${id}/apply`,
      request
    );
  },
};
