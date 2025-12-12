import { api } from '../lib/api-client';
import type { HelpArticle, CreateHelpArticleRequest, UpdateHelpArticleRequest } from '../types/help';

export const helpService = {
  /**
   * Get help articles for a specific context key
   */
  async getByContext(contextKey?: string): Promise<HelpArticle[]> {
    const url = contextKey ? `/helparticles?contextKey=${encodeURIComponent(contextKey)}` : '/helparticles';
    return api.get<HelpArticle[]>(url);
  },

  /**
   * Get help articles for a specific module
   */
  async getByModule(moduleName: string): Promise<HelpArticle[]> {
    return api.get<HelpArticle[]>(`/helparticles/module/${encodeURIComponent(moduleName)}`);
  },

  /**
   * Search help articles
   */
  async search(query: string): Promise<HelpArticle[]> {
    return api.get<HelpArticle[]>(`/helparticles/search?query=${encodeURIComponent(query)}`);
  },

  /**
   * Get a specific help article by ID
   */
  async getById(id: string): Promise<HelpArticle> {
    return api.get<HelpArticle>(`/helparticles/${id}`);
  },

  /**
   * Create a new help article (Admin only)
   */
  async create(request: CreateHelpArticleRequest): Promise<HelpArticle> {
    return api.post<HelpArticle>('/helparticles', request);
  },

  /**
   * Update an existing help article (Admin only)
   */
  async update(id: string, request: UpdateHelpArticleRequest): Promise<void> {
    return api.put<void>(`/helparticles/${id}`, request);
  },

  /**
   * Delete a help article (Admin only)
   */
  async delete(id: string): Promise<void> {
    return api.delete<void>(`/helparticles/${id}`);
  },

  /**
   * Get all help articles for admin management (Admin only)
   */
  async getAllForAdmin(includeDeleted = false): Promise<HelpArticle[]> {
    return api.get<HelpArticle[]>(`/helparticles/admin/all?includeDeleted=${includeDeleted}`);
  },
};
