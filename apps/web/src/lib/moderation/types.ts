/**
 * Content Moderation Types
 *
 * Type definitions for the content moderation system.
 */

// Content types that can be reported
export type ContentType =
  | 'post'
  | 'comment'
  | 'message'
  | 'tool'
  | 'space'
  | 'profile'
  | 'event';

// Report categories
export type ReportCategory =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'misinformation'
  | 'copyright'
  | 'privacy_violation'
  | 'violence'
  | 'self_harm'
  | 'impersonation'
  | 'other';

// Severity levels
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

// Moderation actions
export type ModerationAction =
  | 'no_action'
  | 'warn_user'
  | 'hide_content'
  | 'remove_content'
  | 'suspend_user'
  | 'ban_user'
  | 'escalate_human';

// Report status
export type ReportStatus =
  | 'pending'
  | 'under_review'
  | 'resolved'
  | 'dismissed'
  | 'escalated';

export interface ContentReport {
  id: string;
  reporterId: string;
  reporterInfo: {
    name: string;
    email: string;
    trustScore: number;
  };
  contentId: string;
  contentType: ContentType;
  contentOwnerId: string;
  spaceId?: string;
  category: ReportCategory;
  subCategory?: string;
  severity: SeverityLevel;
  description: string;
  evidence?: {
    screenshots: string[];
    urls: string[];
    additionalContext: string;
  };
  metadata: {
    userAgent: string;
    ipAddress?: string;
    timestamp: string;
    contentSnapshot: Record<string, unknown>;
    reporterHistory: {
      totalReports: number;
      accurateReports: number;
      falseReports: number;
    };
  };
  status: ReportStatus;
  assignedModerator?: string;
  moderationHistory: ModerationEvent[];
  resolution?: {
    action: ModerationAction;
    reason: string;
    moderator: string;
    timestamp: string;
    appealable: boolean;
  };
  aiAnalysis?: AIAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationEvent {
  id: string;
  action: string;
  moderator: string;
  timestamp: string;
  reason: string;
  previousStatus: ReportStatus;
  newStatus: ReportStatus;
  notes?: string;
}

export interface AIAnalysisResult {
  confidence: number;
  suggestedAction: ModerationAction;
  riskScore: number;
  categories: {
    category: ReportCategory;
    confidence: number;
  }[];
  languageAnalysis: {
    toxicity: number;
    threat: number;
    profanity: number;
    identity_attack: number;
  };
  contextualFactors: {
    userHistory: number;
    contentPopularity: number;
    spaceContext: number;
  };
  flags: string[];
  reasoning: string;
  processingTime: number;
  modelVersion: string;
}

export interface ModerationQueue {
  id: string;
  name: string;
  description: string;
  priority: number;
  filters: {
    categories: ReportCategory[];
    severities: SeverityLevel[];
    contentTypes: ContentType[];
    ageRange: {
      min: number; // hours
      max: number; // hours
    };
    aiConfidence: {
      min: number;
      max: number;
    };
  };
  assignedModerators: string[];
  autoAssignment: boolean;
  maxConcurrentReports: number;
  isActive: boolean;
  statistics: {
    totalReports: number;
    pendingReports: number;
    processedToday: number;
    averageResolutionTime: number; // minutes
  };
}

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  conditions: {
    categories: ReportCategory[];
    severities: SeverityLevel[];
    aiConfidence: number;
    reporterTrustScore: number;
    multipleReports: number;
    contentAge: number; // hours
  };
  actions: {
    automatic: ModerationAction[];
    requireHumanReview: boolean;
    notifyModerators: boolean;
    escalateImmediately: boolean;
  };
  statistics: {
    triggered: number;
    accuracy: number;
    lastTriggered?: string;
  };
}

// Feedback types for moderation analytics
export interface ModerationFeedback {
  reportId: string;
  originalAction: ModerationAction;
  feedbackType: 'correct' | 'incorrect' | 'partial';
  correctAction?: ModerationAction;
  reason?: string;
  moderatorId: string;
  timestamp: string;
}

export interface ModerationAccuracyStats {
  period: string;
  totalDecisions: number;
  correctDecisions: number;
  incorrectDecisions: number;
  partialDecisions: number;
  accuracy: number;
  byCategory: Record<ReportCategory, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
  byAction: Record<ModerationAction, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
}
