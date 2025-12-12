import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appTileService } from '../services/appTileService';
import { useAuthStore } from '../stores/authStore';
import type { CreateAppTileRequest, UpdateAppTileRequest } from '../types/appTile';

const APP_TILES_QUERY_KEY = 'appTiles';

/**
 * Hook to get all tiles for the current user
 */
export function useAppTiles() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [APP_TILES_QUERY_KEY, 'all'],
    queryFn: () => appTileService.getAll(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get tenant-wide tiles for admin management
 */
export function useTenantTiles() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [APP_TILES_QUERY_KEY, 'tenant'],
    queryFn: () => appTileService.getTenantTiles(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute for admin view
  });
}

/**
 * Hook to get user's personal tiles
 */
export function useUserTiles() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [APP_TILES_QUERY_KEY, 'user'],
    queryFn: () => appTileService.getUserTiles(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to create a tenant-wide tile
 */
export function useCreateTenantTile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAppTileRequest) => appTileService.createTenantTile(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APP_TILES_QUERY_KEY] });
    },
  });
}

/**
 * Hook to create a personal user tile
 */
export function useCreateUserTile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAppTileRequest) => appTileService.createUserTile(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APP_TILES_QUERY_KEY] });
    },
  });
}

/**
 * Hook to update a tile
 */
export function useUpdateTile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateAppTileRequest }) =>
      appTileService.update(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APP_TILES_QUERY_KEY] });
    },
  });
}

/**
 * Hook to delete a tile
 */
export function useDeleteTile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appTileService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APP_TILES_QUERY_KEY] });
    },
  });
}
