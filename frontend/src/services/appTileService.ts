import { api } from '../lib/api-client';
import type { AppTile, CreateAppTileRequest, UpdateAppTileRequest } from '../types/appTile';

const BASE_URL = '/apptiles';

export const appTileService = {
  // Get all tiles for the current user (built-in + tenant + personal)
  getAll: async (): Promise<AppTile[]> => {
    return api.get<AppTile[]>(BASE_URL);
  },

  // Get tenant-wide tiles for admin management
  getTenantTiles: async (): Promise<AppTile[]> => {
    return api.get<AppTile[]>(`${BASE_URL}/tenant`);
  },

  // Get user's personal tiles
  getUserTiles: async (): Promise<AppTile[]> => {
    return api.get<AppTile[]>(`${BASE_URL}/user`);
  },

  // Create a tenant-wide tile (admin)
  createTenantTile: async (request: CreateAppTileRequest): Promise<AppTile> => {
    return api.post<AppTile>(`${BASE_URL}/tenant`, request);
  },

  // Create a personal user tile
  createUserTile: async (request: CreateAppTileRequest): Promise<AppTile> => {
    return api.post<AppTile>(`${BASE_URL}/user`, request);
  },

  // Update a tile
  update: async (id: string, request: UpdateAppTileRequest): Promise<void> => {
    return api.put<void>(`${BASE_URL}/${id}`, request);
  },

  // Delete a tile
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`${BASE_URL}/${id}`);
  },
};
