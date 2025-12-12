export enum FeedbackType {
  Bug = 0,
  Enhancement = 1,
  Question = 2,
  Other = 3,
}

export enum FeedbackPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export enum FeedbackStatus {
  New = 0,
  UnderReview = 1,
  InProgress = 2,
  Resolved = 3,
  Closed = 4,
  WontFix = 5,
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  priority: FeedbackPriority;
  title: string;
  description: string;
  pageUrl?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  screenshotUrl?: string;
  status: FeedbackStatus;
  adminNotes?: string;
  externalTicketId?: string;
  externalTicketUrl?: string;
  aiConversationHistory?: string;
  refinedRequirements?: string;
  submittedByUserId: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface CreateFeedbackRequest {
  type: FeedbackType;
  priority?: FeedbackPriority;
  title: string;
  description?: string;
  pageUrl?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  screenshotUrl?: string;
  aiConversationHistory?: string;
  refinedRequirements?: string;
}

export interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  adminNotes?: string;
  externalTicketId?: string;
  externalTicketUrl?: string;
}

export interface FeedbackStats {
  total: number;
  new: number;
  underReview: number;
  inProgress: number;
  resolved: number;
  closed: number;
  bugs: number;
  enhancements: number;
  questions: number;
  critical: number;
  high: number;
}

// Helper functions for display
export const feedbackTypeLabels: Record<FeedbackType, string> = {
  [FeedbackType.Bug]: 'Bug Report',
  [FeedbackType.Enhancement]: 'Enhancement',
  [FeedbackType.Question]: 'Question',
  [FeedbackType.Other]: 'Other',
};

export const feedbackPriorityLabels: Record<FeedbackPriority, string> = {
  [FeedbackPriority.Low]: 'Low',
  [FeedbackPriority.Medium]: 'Medium',
  [FeedbackPriority.High]: 'High',
  [FeedbackPriority.Critical]: 'Critical',
};

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  [FeedbackStatus.New]: 'New',
  [FeedbackStatus.UnderReview]: 'Under Review',
  [FeedbackStatus.InProgress]: 'In Progress',
  [FeedbackStatus.Resolved]: 'Resolved',
  [FeedbackStatus.Closed]: 'Closed',
  [FeedbackStatus.WontFix]: "Won't Fix",
};

export const feedbackPriorityColors: Record<FeedbackPriority, string> = {
  [FeedbackPriority.Low]: 'bg-gray-100 text-gray-700',
  [FeedbackPriority.Medium]: 'bg-blue-100 text-blue-700',
  [FeedbackPriority.High]: 'bg-orange-100 text-orange-700',
  [FeedbackPriority.Critical]: 'bg-red-100 text-red-700',
};

export const feedbackStatusColors: Record<FeedbackStatus, string> = {
  [FeedbackStatus.New]: 'bg-purple-100 text-purple-700',
  [FeedbackStatus.UnderReview]: 'bg-yellow-100 text-yellow-700',
  [FeedbackStatus.InProgress]: 'bg-blue-100 text-blue-700',
  [FeedbackStatus.Resolved]: 'bg-green-100 text-green-700',
  [FeedbackStatus.Closed]: 'bg-gray-100 text-gray-700',
  [FeedbackStatus.WontFix]: 'bg-red-100 text-red-700',
};
