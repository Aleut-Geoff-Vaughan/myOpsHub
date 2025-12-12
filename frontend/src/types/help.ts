export interface HelpArticle {
  id: string;
  contextKey: string;
  title: string;
  description?: string;
  jiraArticleUrl?: string;
  videoUrl?: string;
  videoTitle?: string;
  content?: string;
  sortOrder: number;
  moduleName?: string;
  tags?: string;
  iconName?: string;
  isSystemWide: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface CreateHelpArticleRequest {
  contextKey: string;
  title: string;
  description?: string;
  jiraArticleUrl?: string;
  videoUrl?: string;
  videoTitle?: string;
  content?: string;
  sortOrder: number;
  moduleName?: string;
  tags?: string;
  iconName?: string;
  isSystemWide: boolean;
}

export interface UpdateHelpArticleRequest {
  contextKey?: string;
  title?: string;
  description?: string;
  jiraArticleUrl?: string;
  videoUrl?: string;
  videoTitle?: string;
  content?: string;
  sortOrder?: number;
  moduleName?: string;
  tags?: string;
  iconName?: string;
  isActive?: boolean;
}

// Context key mapping for routes
export interface HelpContextMapping {
  pattern: RegExp | string;
  contextKey: string;
  moduleName: string;
}
