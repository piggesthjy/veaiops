// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { exportLogsToFile, getLogCount, logger } from '@veaiops/utils';
import { useCallback, useState } from 'react';
import type { FeatureActionType } from '../lib';

/**
 * Parameters interface for logging
 */
interface LogParams {
  level: 'info' | 'warn' | 'error';
  category: string;
  action: string;
  data?: any;
}

/**
 * Parameters interface for logging feature type judgment
 */
interface LogFeatureTypeJudgmentParams {
  featureId: string;
  actionType: FeatureActionType;
  selector: string;
  tooltipContent: string;
}

/**
 * Parameters interface for logging direct action
 */
interface LogDirectActionParams {
  featureId: string;
  selector: string;
  success: boolean;
  error?: string;
}

/**
 * Parameters interface for logging navigation jump
 */
interface LogNavigationJumpParams {
  featureId: string;
  fromRoute: string;
  toRoute: string;
  success: boolean;
  error?: string;
}

/**
 * Parameters interface for logging element wait
 */
interface LogElementWaitParams {
  featureId: string;
  selector: string;
  success: boolean;
  waitTime: number;
  error?: string;
}

/**
 * Parameters interface for logging highlight guide
 */
interface LogHighlightGuideParams {
  featureId: string;
  selector: string;
  success: boolean;
  scrollTime: number;
  error?: string;
}

/**
 * Parameters interface for logging user interaction
 */
interface LogUserInteractionParams {
  featureId: string;
  actionType: FeatureActionType;
  userAction: string;
  success: boolean;
  data?: any;
}

/**
 * Parameters interface for logging performance metrics
 */
interface LogPerformanceParams {
  featureId: string;
  actionType: FeatureActionType;
  metrics: {
    totalTime: number;
    waitTime?: number;
    scrollTime?: number;
    guideTime?: number;
  };
}

/**
 * Parameters interface for logging errors
 */
interface LogErrorParams {
  category: string;
  action: string;
  error: Error | string;
  context?: any;
}

class GuideLogger {
  private static instance: GuideLogger;

  static getInstance(): GuideLogger {
    if (!GuideLogger.instance) {
      GuideLogger.instance = new GuideLogger();
    }
    return GuideLogger.instance;
  }

  private logs: Array<{
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    category: string;
    action: string;
    data: any;
    sessionId: string;
  }> = [];
  private sessionId: string;

  private constructor() {
    this.sessionId = `guide_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Log entry
   */
  private log({ level, category, action, data = {} }: LogParams): void {
    const logEntry = {
      timestamp: Date.now(),
      level,
      category,
      action,
      data: {
        ...data,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      sessionId: this.sessionId,
    };

    this.logs.push(logEntry);

    // Also output to console
    const message = `[GlobalGuide-Logger] ${category} - ${action}`;
    logger[level]({
      message,
      data: logEntry.data,
      source: 'GlobalGuide',
      component: 'GuideLogger',
    });

    // Limit log count
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }
  logFeatureTypeJudgment({
    featureId,
    actionType,
    selector,
    tooltipContent,
  }: LogFeatureTypeJudgmentParams) {
    this.log({
      level: 'info',
      category: 'FeatureTypeJudgment',
      action: 'Judge feature type',
      data: {
        featureId,
        actionType,
        selector,
        tooltipContent,
        judgment:
          actionType === 'direct'
            ? 'Direct trigger type'
            : 'Navigation guide type',
      },
    });
  }

  /**
   * Log direct action
   */
  logDirectAction({
    featureId,
    selector,
    success,
    error,
  }: LogDirectActionParams) {
    this.log({
      level: success ? 'info' : 'error',
      category: 'DirectAction',
      action: 'Direct trigger feature',
      data: {
        featureId,
        selector,
        success,
        error,
        actionType: 'direct',
      },
    });
  }

  /**
   * Log navigation jump
   */
  logNavigationJump({
    featureId,
    fromRoute,
    toRoute,
    success,
    error,
  }: LogNavigationJumpParams) {
    this.log({
      level: success ? 'info' : 'error',
      category: 'NavigationJump',
      action: 'Navigation jump',
      data: {
        featureId,
        fromRoute,
        toRoute,
        success,
        error,
        actionType: 'navigation',
      },
    });
  }

  /**
   * Log element wait
   */
  logElementWait({
    featureId,
    selector,
    success,
    waitTime,
    error,
  }: LogElementWaitParams) {
    this.log({
      level: success ? 'info' : 'warn',
      category: 'ElementWait',
      action: 'Wait for element to load',
      data: {
        featureId,
        selector,
        success,
        waitTime,
        error,
        actionType: 'navigation',
      },
    });
  }

  /**
   * Log highlight guide
   */
  logHighlightGuide({
    featureId,
    selector,
    success,
    scrollTime,
    error,
  }: LogHighlightGuideParams) {
    this.log({
      level: success ? 'info' : 'error',
      category: 'HighlightGuide',
      action: 'Highlight guide display',
      data: {
        featureId,
        selector,
        success,
        scrollTime,
        error,
        actionType: 'navigation',
      },
    });
  }

  /**
   * Log user interaction
   */
  logUserInteraction({
    featureId,
    actionType,
    userAction,
    success,
    data,
  }: LogUserInteractionParams) {
    this.log({
      level: success ? 'info' : 'warn',
      category: 'UserInteraction',
      action: 'User interaction',
      data: {
        featureId,
        actionType,
        userAction,
        success,
        ...data,
      },
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance({
    featureId,
    actionType,
    metrics,
  }: {
    featureId: string;
    actionType: FeatureActionType;
    metrics: {
      totalTime: number;
      waitTime?: number;
      scrollTime?: number;
      guideTime?: number;
    };
  }) {
    this.log({
      level: 'info',
      category: 'Performance',
      action: 'Performance metrics',
      data: {
        featureId,
        actionType,
        metrics,
      },
    });
  }

  /**
   * Log error
   */
  logError({
    category,
    action,
    error,
    context,
  }: {
    category: string;
    action: string;
    error: Error | string;
    context?: any;
  }) {
    this.log({
      level: 'error',
      category,
      action,
      data: {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        context,
      },
    });
  }

  /**
   * Get all logs
   */
  getAllLogs() {
    return [...this.logs];
  }

  /**
   * Get logs in specified time range
   */
  getLogsInRange({
    startTime,
    endTime,
  }: {
    startTime: number;
    endTime: number;
  }) {
    return this.logs.filter(
      (log) => log.timestamp >= startTime && log.timestamp <= endTime,
    );
  }

  /**
   * Filter logs by category
   */
  getLogsByCategory({ category }: { category: string }) {
    return this.logs.filter((log) => log.category === category);
  }

  /**
   * Filter logs by feature ID
   */
  getLogsByFeature({ featureId }: { featureId: string }) {
    return this.logs.filter((log) => log.data.featureId === featureId);
  }

  /**
   * Get session ID
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get log statistics
   */
  getLogStats() {
    const stats = {
      total: this.logs.length,
      byLevel: { info: 0, warn: 0, error: 0 },
      byCategory: {} as Record<string, number>,
      byActionType: { direct: 0, navigation: 0 },
      byFeature: {} as Record<string, number>,
    };

    this.logs.forEach((log) => {
      stats.byLevel[log.level]++;
      stats.byCategory[log.category] =
        (stats.byCategory[log.category] || 0) + 1;

      if (
        log.data.actionType &&
        (log.data.actionType === 'direct' ||
          log.data.actionType === 'navigation')
      ) {
        stats.byActionType[log.data.actionType as 'direct' | 'navigation']++;
      }

      if (log.data.featureId) {
        stats.byFeature[log.data.featureId] =
          (stats.byFeature[log.data.featureId] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Export logs as JSON
   */
  exportAsJSON() {
    const exportData = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      stats: this.getLogStats(),
      logs: this.logs,
      summary: {
        totalLogs: this.logs.length,
        sessionDuration:
          this.logs.length > 0
            ? this.logs[this.logs.length - 1].timestamp - this.logs[0].timestamp
            : 0,
        featuresUsed: Object.keys(this.getLogStats().byFeature),
        actionTypesUsed: Object.keys(this.getLogStats().byActionType),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export logs as text
   */
  exportAsText() {
    const stats = this.getLogStats();
    const header = [
      'Intelligent Guide Feature Log Export',
      `Session ID: ${this.sessionId}`,
      `Export Time: ${new Date().toISOString()}`,
      `Total Logs: ${stats.total}`,
      `Action Type Stats: Direct Trigger (${stats.byActionType.direct}) | Navigation Guide (${stats.byActionType.navigation})`,
      `Features Used: ${Object.keys(stats.byFeature).join(', ')}`,
      '='.repeat(80),
      '',
    ].join('\n');

    const logLines = this.logs.map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const prefix = `[${timestamp}][${log.level.toUpperCase()}][${
        log.category
      }]`;
      const dataStr = log.data
        ? ` | Data: ${JSON.stringify(log.data, null, 2)}`
        : '';
      return `${prefix} ${log.action}${dataStr}`;
    });

    return header + logLines.join('\n\n');
  }
}

/**
 * Intelligent guide log collection Hook
 */
export const useGuideLogger = () => {
  const [guideLogger] = useState(() => GuideLogger.getInstance());
  const [isCollecting, setIsCollecting] = useState(true);

  // Start collecting logs
  const startCollection = useCallback(() => {
    setIsCollecting(true);
    logger.info({
      message: '[GlobalGuide] Start collecting intelligent guide logs',
      data: { sessionId: guideLogger.getSessionId() },
      source: 'GlobalGuide',
      component: 'useGuideLogger',
    });
  }, [guideLogger]);

  // Stop collecting logs
  const stopCollection = useCallback(() => {
    setIsCollecting(false);
    logger.info({
      message: '[GlobalGuide] Stop collecting intelligent guide logs',
      data: {
        sessionId: guideLogger.getSessionId(),
        totalLogs: guideLogger.getAllLogs().length,
      },
      source: 'GlobalGuide',
      component: 'useGuideLogger',
    });
  }, [guideLogger]);

  // Export intelligent guide logs
  const exportGuideLogs = useCallback(
    (format: 'json' | 'text' = 'text') => {
      const logs = guideLogger.getAllLogs();
      if (logs.length === 0) {
        logger.warn({
          message: '[GlobalGuide] No intelligent guide logs to export',
          data: {},
          source: 'GlobalGuide',
          component: 'useGuideLogger',
        });
        return;
      }

      const content =
        format === 'json'
          ? guideLogger.exportAsJSON()
          : guideLogger.exportAsText();

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      link.download = `global-guide-logs-${timestamp}.${
        format === 'json' ? 'json' : 'txt'
      }`;
      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info({
        message: '[GlobalGuide] Intelligent guide logs exported',
        data: {
          format,
          logCount: logs.length,
          sessionId: guideLogger.getSessionId(),
        },
        source: 'GlobalGuide',
        component: 'useGuideLogger',
      });
    },
    [guideLogger],
  );

  // Export all logs (including intelligent guide logs)
  const exportAllLogs = useCallback(() => {
    const allLogCount = getLogCount();
    const guideLogCount = guideLogger.getAllLogs().length;

    logger.info({
      message: '[GlobalGuide] Export all logs',
      data: {
        allLogCount,
        guideLogCount,
        sessionId: guideLogger.getSessionId(),
      },
      source: 'GlobalGuide',
      component: 'useGuideLogger',
    });

    // Export all logs
    exportLogsToFile();

    // Also export intelligent guide specific logs
    if (guideLogCount > 0) {
      setTimeout(() => {
        exportGuideLogs('text');
      }, 500);
    }
  }, [guideLogger, exportGuideLogs]);

  // Clear logs
  const clearLogs = useCallback(() => {
    guideLogger.clearLogs();
    logger.info({
      message: '[GlobalGuide] Intelligent guide logs cleared',
      data: { sessionId: guideLogger.getSessionId() },
      source: 'GlobalGuide',
      component: 'useGuideLogger',
    });
  }, [guideLogger]);

  // Get log statistics
  const getStats = useCallback(() => {
    return guideLogger.getLogStats();
  }, [guideLogger]);

  // Get logs in specified time range
  const getLogsInRange = useCallback(
    ({ startTime, endTime }: { startTime: number; endTime: number }) => {
      return guideLogger.getLogsInRange({ startTime, endTime });
    },
    [guideLogger],
  );

  // Get logs by feature
  const getLogsByFeature = useCallback(
    ({ featureId }: { featureId: string }) => {
      return guideLogger.getLogsByFeature({ featureId });
    },
    [guideLogger],
  );

  return {
    // Logging methods
    logFeatureTypeJudgment:
      guideLogger.logFeatureTypeJudgment.bind(guideLogger),
    logDirectAction: guideLogger.logDirectAction.bind(guideLogger),
    logNavigationJump: guideLogger.logNavigationJump.bind(guideLogger),
    logElementWait: guideLogger.logElementWait.bind(guideLogger),
    logHighlightGuide: guideLogger.logHighlightGuide.bind(guideLogger),
    logUserInteraction: guideLogger.logUserInteraction.bind(guideLogger),
    logPerformance: guideLogger.logPerformance.bind(guideLogger),
    logError: guideLogger.logError.bind(guideLogger),

    // Log management methods
    startCollection,
    stopCollection,
    exportGuideLogs,
    exportAllLogs,
    clearLogs,
    getStats,
    getLogsInRange,
    getLogsByFeature,

    // State
    isCollecting,
    sessionId: guideLogger.getSessionId(),
    logCount: guideLogger.getAllLogs().length,
  };
};

// Export singleton instance for use elsewhere
export const guideLogger = GuideLogger.getInstance();

// Default export
export default useGuideLogger;
