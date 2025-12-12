export interface AppTile {
  id: string;
  name: string;
  description?: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
  url: string;
  openInNewTab: boolean;
  sortOrder: number;
  isBuiltIn: boolean;
  isActive: boolean;
  category?: string;
  isTenantTile: boolean;
  isUserTile: boolean;
}

export interface CreateAppTileRequest {
  name: string;
  description?: string;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  url: string;
  openInNewTab?: boolean;
  sortOrder?: number;
  category?: string;
}

export interface UpdateAppTileRequest {
  name?: string;
  description?: string;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  url?: string;
  openInNewTab?: boolean;
  sortOrder?: number;
  category?: string;
  isActive?: boolean;
}
