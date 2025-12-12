import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { helpService } from '../services/helpService';
import { useAuthStore } from '../stores/authStore';
import type { CreateHelpArticleRequest, UpdateHelpArticleRequest } from '../types/help';

const HELP_QUERY_KEY = 'helpArticles';

/**
 * Hook to get help articles for a specific context key
 * Only fetches when user is authenticated to prevent login page refresh loops
 */
export function useHelpByContext(contextKey?: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [HELP_QUERY_KEY, 'context', contextKey],
    queryFn: () => helpService.getByContext(contextKey),
    enabled: !!contextKey && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes - help content doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to get help articles for a specific module
 */
export function useHelpByModule(moduleName?: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [HELP_QUERY_KEY, 'module', moduleName],
    queryFn: () => helpService.getByModule(moduleName!),
    enabled: !!moduleName && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to search help articles
 */
export function useHelpSearch(query: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [HELP_QUERY_KEY, 'search', query],
    queryFn: () => helpService.search(query),
    enabled: query.length >= 2 && isAuthenticated, // Only search with 2+ characters
    staleTime: 60 * 1000, // 1 minute for search results
  });
}

/**
 * Hook to get a specific help article by ID
 */
export function useHelpArticle(id?: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [HELP_QUERY_KEY, id],
    queryFn: () => helpService.getById(id!),
    enabled: !!id && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get all help articles for admin management
 */
export function useHelpArticlesAdmin(includeDeleted = false) {
  return useQuery({
    queryKey: [HELP_QUERY_KEY, 'admin', includeDeleted],
    queryFn: () => helpService.getAllForAdmin(includeDeleted),
    staleTime: 60 * 1000, // 1 minute for admin view
  });
}

/**
 * Hook to create a new help article
 */
export function useCreateHelpArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateHelpArticleRequest) => helpService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HELP_QUERY_KEY] });
    },
  });
}

/**
 * Hook to update a help article
 */
export function useUpdateHelpArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateHelpArticleRequest }) =>
      helpService.update(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HELP_QUERY_KEY] });
    },
  });
}

/**
 * Hook to delete a help article
 */
export function useDeleteHelpArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => helpService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HELP_QUERY_KEY] });
    },
  });
}
