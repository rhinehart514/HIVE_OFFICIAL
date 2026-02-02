/**
 * Content Moderation Service
 * Comprehensive content reporting, flagging, and automated moderation system
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { createNotification } from '@/lib/notification-service';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';

// Re-export types for backwards compatibility
export type {
  ContentType,
  ReportCategory,
  SeverityLevel,
  ModerationAction,
  ReportStatus,
  ContentReport,
  ModerationEvent,
  AIAnalysisResult,
  ModerationQueue,
  ModerationRule,
} from './moderation/types';

// Import types for internal use
import type {
  ContentType,
  ReportCategory,
  SeverityLevel,
  ModerationAction,
  ReportStatus,
  ContentReport,
  ModerationEvent,
  AIAnalysisResult,
  ModerationQueue,
  ModerationRule,
} from './moderation/types';

export class ContentModerationService {
  
  /**
   * Submit a content report
   */
  async submitReport(reportData: {
    reporterId: string;
    contentId: string;
    contentType: ContentType;
    category: ReportCategory;
    subCategory?: string;
    description: string;
    evidence?: ContentReport['evidence'];
    spaceId?: string;
    userAgent: string;
  }): Promise<string> {
    try {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      // Get reporter information
      const reporterInfo = await this.getReporterInfo(reportData.reporterId);
      
      // Get content information and snapshot
      const contentInfo = await this.getContentInfo(reportData.contentId, reportData.contentType);
      
      // Calculate initial severity
      const severity = this.calculateSeverity(reportData.category, reporterInfo.trustScore);

      // Create report
      const report: ContentReport = {
        id: reportId,
        reporterId: reportData.reporterId,
        reporterInfo,
        contentId: reportData.contentId,
        contentType: reportData.contentType,
        contentOwnerId: contentInfo.ownerId,
        spaceId: reportData.spaceId,
        category: reportData.category,
        subCategory: reportData.subCategory,
        severity,
        description: reportData.description,
        evidence: reportData.evidence,
        metadata: {
          userAgent: reportData.userAgent,
          timestamp: new Date().toISOString(),
          contentSnapshot: contentInfo.content,
          reporterHistory: await this.getReporterHistory(reportData.reporterId)
        },
        status: 'pending',
        moderationHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store report with campus isolation metadata
      await dbAdmin.collection('contentReports').doc(reportId).set({
        ...report,
        campusId: CURRENT_CAMPUS_ID
      });

      // Trigger AI analysis
      const aiAnalysis = await this.performAIAnalysis(report);
      if (aiAnalysis) {
        await this.updateReport(reportId, { aiAnalysis });
      }

      // Apply automated rules
      await this.applyAutomatedRules(reportId);

      // Assign to moderation queue
      await this.assignToQueue(reportId);

      // Update reporter statistics
      await this.updateReporterStats(reportData.reporterId);

      // Notify relevant parties
      await this.sendReportNotifications(reportId);

      logger.info('Content report submitted', {
        reportId,
        category: reportData.category
      });

      return reportId;
    } catch (error) {
      logger.error('Error submitting content report', { error: { error: error instanceof Error ? error.message : String(error) }, postData: reportData });
      throw error;
    }
  }

  /**
   * Process moderation action
   */
  async processModerationAction(
    reportId: string,
    moderatorId: string,
    action: ModerationAction,
    reason: string,
    notes?: string
  ): Promise<void> {
    try {
      const report = await this.getReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Create moderation event
      const event: ModerationEvent = {
        id: `event_${Date.now()}`,
        action,
        moderator: moderatorId,
        timestamp: new Date().toISOString(),
        reason,
        previousStatus: report.status,
        newStatus: this.getStatusFromAction(action),
        notes
      };

      // Execute the moderation action
      await this.executeAction(action, report);

      // Update report
      const updates: Partial<ContentReport> = {
        status: event.newStatus,
        assignedModerator: moderatorId,
        moderationHistory: [...report.moderationHistory, event],
        updatedAt: new Date().toISOString()
      };

      if (action !== 'no_action' && action !== 'escalate_human') {
        updates.resolution = {
          action,
          reason,
          moderator: moderatorId,
          timestamp: new Date().toISOString(),
          appealable: this.isActionAppealable(action)
        };
      }

      await this.updateReport(reportId, updates);

      // Update statistics
      await this.updateModerationStats(moderatorId, action);

      // Send notifications
      await this.sendModerationNotifications(reportId, action);

      logger.info('Moderation action processed', { reportId, action, moderatorId });
    } catch (error) {
      logger.error('Error processing moderation action', { error: { error: error instanceof Error ? error.message : String(error) }, reportId, action });
      throw error;
    }
  }

  /**
   * Get moderation queue with filters
   */
  async getModerationQueue(
    queueId?: string,
    moderatorId?: string,
    limit: number = 50
  ): Promise<ContentReport[]> {
    try {
      let query = dbAdmin.collection('contentReports')
        .where('campusId', '==', CURRENT_CAMPUS_ID)
        .where('status', 'in', ['pending', 'under_review'])
        .orderBy('severity', 'desc')
        .orderBy('createdAt', 'asc')
        .limit(limit);

      // Apply queue filters if specified
      if (queueId) {
        const queue = await this.getQueue(queueId);
        if (queue) {
          query = this.applyQueueFilters(query, queue);
        }
      }

      // Filter by assigned moderator
      if (moderatorId) {
        query = query.where('assignedModerator', '==', moderatorId);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data() as ContentReport);
    } catch (error) {
      logger.error('Error getting moderation queue', { error: { error: error instanceof Error ? error.message : String(error) } });
      throw error;
    }
  }

  /**
   * Perform AI analysis on content using ML Content Analyzer
   */
  private async performAIAnalysis(report: ContentReport): Promise<AIAnalysisResult | null> {
    try {
      const startTime = Date.now();

      // Get content text from snapshot
      const contentText = this.extractContentText(report.metadata.contentSnapshot);
      if (!contentText) {
        logger.warn('No content text found for AI analysis', { reportId: report.id });
        return null;
      }

      // Use ML Content Analyzer for real analysis
      const { mlContentAnalyzer } = await import('./ml-content-analyzer');
      const mlResult = await mlContentAnalyzer.analyze(contentText, {
        checkToxicity: true,
        checkSpam: true,
        checkPII: true,
        contextType: this.mapContentTypeToContext(report.contentType),
        userTrustScore: report.reporterInfo?.trustScore ?? 0.5,
        isFirstPost: false,
      });

      // Map ML result to AIAnalysisResult format
      const analysis: AIAnalysisResult = {
        confidence: mlResult.confidence,
        suggestedAction: this.mapMlActionToModerationAction(mlResult.suggestedAction),
        riskScore: mlResult.riskScore,
        categories: mlResult.categories.map(c => ({
          category: c.category as ReportCategory,
          confidence: c.confidence,
        })),
        languageAnalysis: {
          toxicity: mlResult.toxicityScores.toxicity,
          threat: mlResult.toxicityScores.threat,
          profanity: mlResult.toxicityScores.profanity,
          identity_attack: mlResult.toxicityScores.identityAttack,
        },
        contextualFactors: {
          userHistory: await this.getUserRiskScore(),
          contentPopularity: 0.5, // Default until we have engagement data
          spaceContext: report.spaceId ? 0.5 : 0.3,
        },
        flags: mlResult.flags,
        reasoning: mlResult.reasoning,
        processingTime: mlResult.processingTime,
        modelVersion: mlResult.modelVersion,
      };

      logger.info('ML analysis completed', {
        reportId: report.id,
        riskScore: analysis.riskScore,
        suggestedAction: analysis.suggestedAction,
        processingTime: analysis.processingTime,
      });

      return analysis;
    } catch (error) {
      logger.error('Error performing AI analysis', { error: { error: error instanceof Error ? error.message : String(error) }, reportId: report.id });
      return null;
    }
  }

  /**
   * Extract text content from content snapshot
   */
  private extractContentText(snapshot: Record<string, unknown>): string | null {
    // Try common content field names
    const possibleFields = ['content', 'text', 'body', 'message', 'description', 'title', 'name', 'bio'];
    const textParts: string[] = [];

    for (const field of possibleFields) {
      const value = snapshot[field];
      if (typeof value === 'string' && value.trim()) {
        textParts.push(value);
      }
    }

    return textParts.length > 0 ? textParts.join(' ') : null;
  }

  /**
   * Map content type to ML analysis context
   */
  private mapContentTypeToContext(contentType: ContentType): 'chat' | 'post' | 'profile' | 'event' | 'space' {
    switch (contentType) {
      case 'message': return 'chat';
      case 'post': return 'post';
      case 'comment': return 'chat';
      case 'profile': return 'profile';
      case 'event': return 'event';
      case 'space': return 'space';
      case 'tool': return 'post';
      default: return 'post';
    }
  }

  /**
   * Map ML suggested action to moderation action
   */
  private mapMlActionToModerationAction(mlAction: string): ModerationAction {
    switch (mlAction) {
      case 'no_action': return 'no_action';
      case 'flag': return 'warn_user';
      case 'hide': return 'hide_content';
      case 'remove': return 'remove_content';
      case 'escalate': return 'escalate_human';
      default: return 'no_action';
    }
  }

  /**
   * Apply automated moderation rules
   */
  private async applyAutomatedRules(reportId: string): Promise<void> {
    try {
      const report = await this.getReport(reportId);
      if (!report) return;

      const rules = await this.getActiveRules();
      
      for (const rule of rules) {
        if (this.ruleMatches(rule, report)) {
          await this.triggerRule(rule, reportId);
          
          // Update rule statistics
          await this.updateRuleStats(rule.id);
          
          // Break if rule requires immediate action
          if (rule.actions.escalateImmediately) {
            break;
          }
        }
      }
    } catch (error) {
      logger.error('Error applying automated rules', { error: { error: error instanceof Error ? error.message : String(error) }, reportId });
    }
  }

  /**
   * Execute moderation action
   */
  private async executeAction(action: ModerationAction, report: ContentReport): Promise<void> {
    try {
      switch (action) {
        case 'hide_content':
          await this.hideContent(report.contentId, report.contentType);
          break;
          
        case 'remove_content':
          await this.removeContent(report.contentId, report.contentType);
          break;
          
        case 'warn_user':
          await this.warnUser(report.contentOwnerId, report.category);
          break;
          
        case 'suspend_user':
          await this.suspendUser(report.contentOwnerId, 7); // 7 days
          break;
          
        case 'ban_user':
          await this.banUser(report.contentOwnerId);
          break;
          
        case 'escalate_human':
          await this.escalateToHuman(report.id);
          break;
          
        case 'no_action':
          // No action needed
          break;
      }
    } catch (error) {
      logger.error('Error executing moderation action', { error: { error: error instanceof Error ? error.message : String(error) }, action, reportId: report.id });
      throw error;
    }
  }

  /**
   * Hide content from public view
   */
  private async hideContent(contentId: string, contentType: ContentType): Promise<void> {
    try {
      const collection = this.getContentCollection(contentType);
      await dbAdmin.collection(collection).doc(contentId).update({
        isHidden: true,
        hiddenAt: new Date().toISOString(),
        hiddenReason: 'Content violates community guidelines'
      });
    } catch (error) {
      logger.error('Error hiding content', { error: { error: error instanceof Error ? error.message : String(error) } });
      throw error;
    }
  }

  /**
   * Remove content permanently
   */
  private async removeContent(contentId: string, contentType: ContentType): Promise<void> {
    try {
      const collection = this.getContentCollection(contentType);
      
      // Soft delete - mark as deleted but keep for appeals
      await dbAdmin.collection(collection).doc(contentId).update({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedReason: 'Content violates community guidelines'
      });
      
      // Move to deleted content collection
      const contentDoc = await dbAdmin.collection(collection).doc(contentId).get();
      if (contentDoc.exists) {
        await dbAdmin.collection('deletedContent').doc(contentId).set({
          originalCollection: collection,
          originalData: contentDoc.data(),
          deletedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Error removing content', { error: { error: error instanceof Error ? error.message : String(error) } });
      throw error;
    }
  }

  /**
   * Warn user about policy violation
   */
  private async warnUser(userId: string, category: ReportCategory): Promise<void> {
    try {
      const warning = {
        id: `warning_${Date.now()}`,
        userId,
        category,
        message: this.getWarningMessage(category),
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      await dbAdmin.collection('userWarnings').doc(warning.id).set(warning);

      // Send notification to user
      await createNotification({
        userId,
        type: 'system',
        category: 'system',
        title: 'Community Guidelines Warning',
        body: warning.message,
        actionUrl: '/profile/warnings',
      });
    } catch (error) {
      logger.error('Error warning user', { error: { error: error instanceof Error ? error.message : String(error) }, userId, category });
      throw error;
    }
  }

  /**
   * Suspend user account
   */
  private async suspendUser(userId: string, days: number): Promise<void> {
    try {
      const suspensionEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      
      await dbAdmin.collection('users').doc(userId).update({
        isSuspended: true,
        suspendedUntil: suspensionEnd.toISOString(),
        suspendedAt: new Date().toISOString()
      });

      // Log suspension
      await dbAdmin.collection('userSuspensions').add({
        userId,
        suspendedAt: new Date().toISOString(),
        suspendedUntil: suspensionEnd.toISOString(),
        reason: 'Community guidelines violation',
        days
      });

      // Notify user
      await createNotification({
        userId,
        type: 'system',
        category: 'system',
        title: 'Account Suspended',
        body: `Your account has been suspended for ${days} days due to community guidelines violations.`,
        actionUrl: '/profile/suspension',
      });
    } catch (error) {
      logger.error('Error suspending user', { error: { error: error instanceof Error ? error.message : String(error) }, userId });
      throw error;
    }
  }

  /**
   * Ban user account permanently
   */
  private async banUser(userId: string): Promise<void> {
    try {
      await dbAdmin.collection('users').doc(userId).update({
        isBanned: true,
        bannedAt: new Date().toISOString(),
        status: 'banned'
      });

      // Log ban
      await dbAdmin.collection('userBans').add({
        userId,
        bannedAt: new Date().toISOString(),
        reason: 'Severe community guidelines violation',
        permanent: true
      });

      // Notify relevant moderators
      await this.notifyModerators('user_banned', { userId });
    } catch (error) {
      logger.error('Error banning user', { error: { error: error instanceof Error ? error.message : String(error) }, userId });
      throw error;
    }
  }

  // Helper methods
  private async getReporterInfo(reporterId: string) {
    const userDoc = await dbAdmin.collection('users').doc(reporterId).get();
    const userData = userDoc.data();
    
    return {
      name: userData?.displayName || 'Anonymous',
      email: userData?.email || '',
      trustScore: userData?.trustScore || 0.5
    };
  }

  private async getContentInfo(contentId: string, contentType: ContentType) {
    const collection = this.getContentCollection(contentType);
    const doc = await dbAdmin.collection(collection).doc(contentId).get();
    const data = doc.data();
    
    // Enforce campus isolation if content carries campus metadata
    const campusId = data && typeof data === 'object' && 'campusId' in data ? (data as Record<string, unknown>).campusId : undefined;
    if (campusId && campusId !== CURRENT_CAMPUS_ID) {
      logger.error('SECURITY: Cross-campus content access blocked', {
        contentId,
        contentType,
        contentCampus: campusId,
        currentCampus: CURRENT_CAMPUS_ID
      });
      throw new Error('Access denied - campus mismatch');
    }

    return {
      ownerId: data?.userId || data?.authorId || data?.createdBy || 'unknown',
      content: data || {}
    };
  }

  private getContentCollection(contentType: ContentType): string {
    const collections = {
      'post': 'posts',
      'comment': 'comments',
      'message': 'messages',
      'tool': 'tools',
      'space': 'spaces',
      'profile': 'users',
      'event': 'events'
    };
    return collections[contentType];
  }

  private calculateSeverity(category: ReportCategory, trustScore: number): SeverityLevel {
    const baseSeverity = {
      'harassment': 'high',
      'hate_speech': 'critical',
      'violence': 'critical',
      'self_harm': 'critical',
      'spam': 'low',
      'inappropriate_content': 'medium',
      'misinformation': 'medium',
      'copyright': 'medium',
      'privacy_violation': 'high',
      'impersonation': 'high',
      'other': 'low'
    };
    
    let severity = baseSeverity[category] as SeverityLevel;
    
    // Adjust based on reporter trust score
    if (trustScore > 0.8 && severity === 'low') severity = 'medium';
    if (trustScore < 0.3 && severity === 'high') severity = 'medium';
    
    return severity;
  }

  private async getReport(reportId: string): Promise<ContentReport | null> {
    const doc = await dbAdmin.collection('contentReports').doc(reportId).get();
    return doc.exists ? doc.data() as ContentReport : null;
  }

  private async updateReport(reportId: string, updates: Partial<ContentReport>): Promise<void> {
    await dbAdmin.collection('contentReports').doc(reportId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  private getStatusFromAction(action: ModerationAction): ReportStatus {
    const statusMap = {
      'no_action': 'dismissed',
      'warn_user': 'resolved',
      'hide_content': 'resolved',
      'remove_content': 'resolved',
      'suspend_user': 'resolved',
      'ban_user': 'resolved',
      'escalate_human': 'escalated'
    };
    return statusMap[action] as ReportStatus;
  }

  private isActionAppealable(action: ModerationAction): boolean {
    return ['hide_content', 'remove_content', 'suspend_user', 'ban_user'].includes(action);
  }

  private getWarningMessage(category: ReportCategory): string {
    const messages = {
      'spam': 'Please avoid posting repetitive or irrelevant content.',
      'harassment': 'Your behavior has been reported as harassment. Please be respectful to all community members.',
      'hate_speech': 'Content promoting hate speech is not allowed in our community.',
      'inappropriate_content': 'Please ensure your content is appropriate for all community members.',
      'misinformation': 'Please verify information before sharing to maintain community trust.',
      'copyright': 'Please respect intellectual property rights when sharing content.',
      'privacy_violation': 'Please respect other users\' privacy and personal information.',
      'violence': 'Content promoting or depicting violence is not allowed.',
      'self_harm': 'We care about your wellbeing. Please reach out for support if needed.',
      'impersonation': 'Impersonating others is not allowed in our community.',
      'other': 'Your content has been flagged for violating our community guidelines.'
    };
    return messages[category];
  }

  // Mock implementations for remaining methods
  private calculateAIConfidence(): number {
    return Math.random() * 0.5 + 0.5; // 0.5-1.0
  }

  private suggestAction(report: ContentReport): ModerationAction {
    const actions = {
      'critical': 'remove_content',
      'high': 'hide_content', 
      'medium': 'warn_user',
      'low': 'no_action'
    };
    return actions[report.severity] as ModerationAction;
  }

  private calculateRiskScore(): number {
    return Math.random(); // 0-1
  }

  private async getUserRiskScore(): Promise<number> {
    return Math.random(); // 0-1
  }

  private generateFlags(): string[] {
    const possibleFlags = ['repeated_reports', 'high_risk_user', 'viral_content', 'sensitive_space'];
    return possibleFlags.filter(() => Math.random() > 0.7);
  }

  private generateReasoning(report: ContentReport): string {
    return `Content flagged for ${report.category} based on report analysis and user history.`;
  }

  private async getActiveRules(): Promise<ModerationRule[]> {
    const snapshot = await dbAdmin.collection('moderationRules')
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .where('isActive', '==', true)
      .orderBy('priority', 'desc')
      .get();
    return snapshot.docs.map(doc => doc.data() as ModerationRule);
  }

  private ruleMatches(rule: ModerationRule, report: ContentReport): boolean {
    return rule.conditions.categories.includes(report.category) &&
           rule.conditions.severities.includes(report.severity);
  }

  private async triggerRule(rule: ModerationRule, reportId: string): Promise<void> {
    logger.info('Triggering moderation rule', { ruleId: rule.id, reportId });
  }

  private async updateRuleStats(ruleId: string): Promise<void> {
    await dbAdmin.collection('moderationRules').doc(ruleId).update({
      'statistics.triggered': FieldValue.increment(1),
      'statistics.lastTriggered': new Date().toISOString()
    });
  }

  private async assignToQueue(reportId: string): Promise<void> {
    // This would implement queue assignment logic
    logger.info('Assigning report to queue', { reportId });
  }

  private async updateReporterStats(reporterId: string): Promise<void> {
    await dbAdmin.collection('users').doc(reporterId).update({
      'moderationStats.totalReports': FieldValue.increment(1),
      'moderationStats.lastReport': new Date().toISOString()
    });
  }

  private async sendReportNotifications(reportId: string): Promise<void> {
    // Notify moderators of new report
    await this.notifyModerators('new_report', { reportId });
  }

  private async sendModerationNotifications(reportId: string, action: ModerationAction): Promise<void> {
    // Send notifications based on action
    logger.info('Sending moderation notifications', { reportId, action });
  }

  private async updateModerationStats(moderatorId: string, action: ModerationAction): Promise<void> {
    await dbAdmin.collection('users').doc(moderatorId).update({
      'moderationStats.actionsToday': FieldValue.increment(1),
      'moderationStats.lastAction': new Date().toISOString(),
      [`moderationStats.actions.${action}`]: FieldValue.increment(1)
    });
  }

  private async notifyModerators(type: string, data: Record<string, unknown>): Promise<void> {
    // Get active moderators and send notifications
    logger.info('Notifying moderators', { type, data });
  }

  private async escalateToHuman(reportId: string): Promise<void> {
    await this.updateReport(reportId, { status: 'escalated' });
    await this.notifyModerators('escalated_report', { reportId });
  }

  private async getReporterHistory(reporterId: string) {
    const snapshot = await dbAdmin.collection('contentReports')
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .where('reporterId', '==', reporterId)
      .get();
    
    return {
      totalReports: snapshot.size,
      accurateReports: Math.floor(snapshot.size * 0.8),
      falseReports: Math.floor(snapshot.size * 0.2)
    };
  }

  private async getQueue(queueId: string): Promise<ModerationQueue | null> {
    const doc = await dbAdmin.collection('moderationQueues').doc(queueId).get();
    return doc.exists ? doc.data() as ModerationQueue : null;
  }

  private applyQueueFilters(query: FirebaseFirestore.Query, _queue: ModerationQueue): FirebaseFirestore.Query {
    // Apply queue-specific filters
    return query;
  }

  // ============================================================================
  // ML Feedback Loop - Learn from moderator decisions to improve accuracy
  // ============================================================================

  /**
   * Record feedback on ML moderation decision
   * Called when a moderator reviews and decides on flagged content
   */
  async recordModerationFeedback(params: {
    contentId: string;
    contentType: ContentType;
    mlPrediction: {
      scores: Record<string, number>;
      action: 'allow' | 'flag' | 'block';
      confidence: number;
    };
    humanDecision: {
      action: 'allow' | 'flag' | 'block';
      reason?: string;
      moderatorId: string;
    };
  }): Promise<{ id: string; wasCorrect: boolean }> {
    const { contentId, contentType, mlPrediction, humanDecision } = params;

    // Determine if ML was correct
    const wasCorrect = mlPrediction.action === humanDecision.action;

    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const feedback = {
      id: feedbackId,
      contentId,
      contentType,
      campusId: CURRENT_CAMPUS_ID,
      mlPrediction: {
        ...mlPrediction,
        timestamp: new Date().toISOString(),
      },
      humanDecision: {
        ...humanDecision,
        decidedAt: new Date().toISOString(),
      },
      wasCorrect,
      // Calculate disagreement details for analysis
      disagreement: !wasCorrect ? {
        mlSaid: mlPrediction.action,
        humanSaid: humanDecision.action,
        wasOverride: mlPrediction.action !== 'allow' && humanDecision.action === 'allow',
        wasEscalation: mlPrediction.action === 'allow' && humanDecision.action !== 'allow',
      } : null,
      createdAt: new Date().toISOString(),
    };

    await dbAdmin.collection('moderation_feedback').doc(feedbackId).set(feedback);

    // Update moderator stats
    await this.updateModeratorFeedbackStats(humanDecision.moderatorId, wasCorrect);

    // Log for analysis
    logger.info('ML moderation feedback recorded', {
      feedbackId,
      contentId,
      wasCorrect,
      mlAction: mlPrediction.action,
      humanAction: humanDecision.action,
      confidence: mlPrediction.confidence,
    });

    return { id: feedbackId, wasCorrect };
  }

  /**
   * Get ML accuracy statistics over a time period
   */
  async getModerationAccuracyStats(params: {
    startDate?: Date;
    endDate?: Date;
    contentType?: ContentType;
  } = {}): Promise<{
    totalFeedback: number;
    correctPredictions: number;
    accuracy: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    confidenceCorrelation: {
      highConfidence: { total: number; correct: number; accuracy: number };
      mediumConfidence: { total: number; correct: number; accuracy: number };
      lowConfidence: { total: number; correct: number; accuracy: number };
    };
    byContentType: Record<string, { total: number; correct: number; accuracy: number }>;
    recentTrend: { period: string; accuracy: number }[];
  }> {
    const { startDate, endDate, contentType } = params;

    let query: FirebaseFirestore.Query = dbAdmin.collection('moderation_feedback')
      .where('campusId', '==', CURRENT_CAMPUS_ID);

    if (startDate) {
      query = query.where('createdAt', '>=', startDate.toISOString());
    }
    if (endDate) {
      query = query.where('createdAt', '<=', endDate.toISOString());
    }
    if (contentType) {
      query = query.where('contentType', '==', contentType);
    }

    const snapshot = await query.get();
    const feedbacks = snapshot.docs.map(doc => doc.data());

    // Calculate overall accuracy
    const totalFeedback = feedbacks.length;
    const correctPredictions = feedbacks.filter(f => f.wasCorrect).length;
    const accuracy = totalFeedback > 0 ? correctPredictions / totalFeedback : 0;

    // Calculate false positive/negative rates
    const overrides = feedbacks.filter(f => f.disagreement?.wasOverride);
    const escalations = feedbacks.filter(f => f.disagreement?.wasEscalation);
    const falsePositiveRate = totalFeedback > 0 ? overrides.length / totalFeedback : 0;
    const falseNegativeRate = totalFeedback > 0 ? escalations.length / totalFeedback : 0;

    // Group by confidence level
    const highConf = feedbacks.filter(f => f.mlPrediction.confidence >= 0.8);
    const medConf = feedbacks.filter(f => f.mlPrediction.confidence >= 0.5 && f.mlPrediction.confidence < 0.8);
    const lowConf = feedbacks.filter(f => f.mlPrediction.confidence < 0.5);

    const calcAccuracy = (items: typeof feedbacks) => {
      const correct = items.filter(i => i.wasCorrect).length;
      return { total: items.length, correct, accuracy: items.length > 0 ? correct / items.length : 0 };
    };

    // Group by content type
    const byContentType: Record<string, { total: number; correct: number; accuracy: number }> = {};
    const contentTypes = [...new Set(feedbacks.map(f => f.contentType))];
    for (const ct of contentTypes) {
      const ctFeedbacks = feedbacks.filter(f => f.contentType === ct);
      byContentType[ct] = calcAccuracy(ctFeedbacks);
    }

    // Calculate recent trend (last 4 weeks)
    const recentTrend: { period: string; accuracy: number }[] = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekFeedbacks = feedbacks.filter(f => {
        const date = new Date(f.createdAt);
        return date >= weekStart && date < weekEnd;
      });
      const weekAccuracy = weekFeedbacks.length > 0
        ? weekFeedbacks.filter(f => f.wasCorrect).length / weekFeedbacks.length
        : 0;
      recentTrend.push({
        period: `Week ${4 - i}`,
        accuracy: weekAccuracy,
      });
    }

    return {
      totalFeedback,
      correctPredictions,
      accuracy,
      falsePositiveRate,
      falseNegativeRate,
      confidenceCorrelation: {
        highConfidence: calcAccuracy(highConf),
        mediumConfidence: calcAccuracy(medConf),
        lowConfidence: calcAccuracy(lowConf),
      },
      byContentType,
      recentTrend,
    };
  }

  /**
   * Get feedback entries that need review (ML was confident but wrong)
   * These indicate potential threshold adjustments needed
   */
  async getHighConfidenceErrors(limit: number = 20): Promise<{
    feedbackId: string;
    contentId: string;
    contentType: ContentType;
    mlConfidence: number;
    mlAction: string;
    humanAction: string;
    reason?: string;
    createdAt: string;
  }[]> {
    const snapshot = await dbAdmin.collection('moderation_feedback')
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .where('wasCorrect', '==', false)
      .where('mlPrediction.confidence', '>=', 0.8)
      .orderBy('mlPrediction.confidence', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        feedbackId: data.id,
        contentId: data.contentId,
        contentType: data.contentType,
        mlConfidence: data.mlPrediction.confidence,
        mlAction: data.mlPrediction.action,
        humanAction: data.humanDecision.action,
        reason: data.humanDecision.reason,
        createdAt: data.createdAt,
      };
    });
  }

  /**
   * Update moderator's feedback accuracy stats
   */
  private async updateModeratorFeedbackStats(moderatorId: string, wasCorrect: boolean): Promise<void> {
    const updateData: Record<string, FirebaseFirestore.FieldValue | boolean | string> = {
      'feedbackStats.totalReviews': FieldValue.increment(1),
      'feedbackStats.lastReview': new Date().toISOString(),
    };

    if (wasCorrect) {
      updateData['feedbackStats.agreedWithML'] = FieldValue.increment(1);
    } else {
      updateData['feedbackStats.disagreedWithML'] = FieldValue.increment(1);
    }

    await dbAdmin.collection('users').doc(moderatorId).update(updateData);
  }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();
import 'server-only';
