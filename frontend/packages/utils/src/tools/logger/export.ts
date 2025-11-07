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

/**
 * Unified log export tool
 *
 * ✅ Features: Unified export of all logs (including in-memory logs from dedicated log tools)
 * - Collect logs from unified logger
 * - Collect in-memory logs from dedicated log tools (via window interface)
 * - Support JSON and text format export
 */

import { logger } from './core';
import type { LogEntry } from './core';

/**
 * Get log count (from unified logger)
 */
export function getLogCount(): number {
  return logger.getLogCount();
}

/**
 * Clear collected logs (from unified logger)
 */
export function clearCollectedLogs(): void {
  logger.clearLogs();
}

/**
 * Start log collection (unified logger is enabled by default, this function is kept for compatibility)
 */
export function startLogCollection(): void {
  // logger is enabled by default, this function is kept for compatibility
  // If enable/disable functionality needs to be added in the future, it can be implemented here
}

/**
 * Stop log collection (unified logger is enabled by default, this function is kept for compatibility)
 */
export function stopLogCollection(): void {
  // logger is enabled by default, this function is kept for compatibility
  // If enable/disable functionality needs to be added in the future, it can be implemented here
}

/**
 * Export all logs to file
 * @param format Export format: 'json' | 'text', or directly pass custom filename (backward compatible)
 */
export function exportLogsToFile(
  formatOrFilename: 'json' | 'text' | string = 'json',
): void {
  const allLogs = collectAllLogs();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  let content: string;
  let filename: string;
  let mimeType: string;

  // If filename is passed (contains .json or .txt/.log extension), determine format by extension
  if (formatOrFilename.includes('.json')) {
    filename = formatOrFilename;
    content = JSON.stringify(allLogs, null, 2);
    mimeType = 'application/json';
  } else if (
    formatOrFilename.includes('.txt') ||
    formatOrFilename.includes('.log')
  ) {
    filename = formatOrFilename;
    content = formatLogsAsText(allLogs);
    mimeType = 'text/plain;charset=utf-8';
  } else if (formatOrFilename === 'json') {
    content = JSON.stringify(allLogs, null, 2);
    filename = `veaiops-logs-${timestamp}.json`;
    mimeType = 'application/json';
  } else {
    // Default text format
    content = formatLogsAsText(allLogs);
    filename =
      formatOrFilename === 'text'
        ? `veaiops-logs-${timestamp}.txt`
        : `${formatOrFilename}.txt`;
    mimeType = 'text/plain;charset=utf-8';
  }

  // Create download link
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Collect all logs
 * - Unified logger logs (main source)
 * - Enhanced collector logs (API requests, user behavior, performance metrics)
 * - Dedicated log tool in-memory logs (via window interface)
 */
export function collectAllLogs(): {
  unifiedLogs: LogEntry[];
  enhancedLogs: {
    apiRequests?: any[];
    userActions?: any[];
    performanceMetrics?: any;
  };
  componentLogs: {
    customTable?: any[];
    filters?: any[];
    querySync?: any[];
    tableFilter?: any[];
    performance?: any[];
    resetLog?: any[];
    guide?: any[];
    selectBlock?: any[];
  };
  metadata: {
    exportTime: string;
    sessionId: string;
    totalUnifiedLogs: number;
    totalEnhancedLogs: number;
    totalComponentLogs: number;
  };
} {
  // 1. Collect unified logger logs (main source)
  const unifiedLogs = logger.getLogs();

  // 2. Collect enhanced collector logs (API requests, user behavior, performance metrics)
  const enhancedLogs: {
    apiRequests?: any[];
    userActions?: any[];
    performanceMetrics?: any;
  } = {};

  if (typeof window !== 'undefined') {
    try {
      const enhancedCollector = (window as any).__veaiopsEnhancedCollector;
      if (enhancedCollector) {
        if (typeof enhancedCollector.getApiRequests === 'function') {
          enhancedLogs.apiRequests = enhancedCollector.getApiRequests();
        }
        if (typeof enhancedCollector.getUserActions === 'function') {
          enhancedLogs.userActions = enhancedCollector.getUserActions();
        }
        if (typeof enhancedCollector.getPerformanceMetrics === 'function') {
          enhancedLogs.performanceMetrics =
            enhancedCollector.getPerformanceMetrics();
        }
      }
    } catch (error: unknown) {
      // ✅ Silently handle log collection errors (avoid blocking export functionality), but log warning
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[LogExporter] Failed to collect enhanced logs',
          errorObj.message,
        );
      }
    }
  }

  // 2. Collect dedicated log tool in-memory logs (if any)
  const componentLogs: any = {};

  if (typeof window !== 'undefined') {
    // CustomTable logs (including performance logs)
    try {
      const { getCustomTableLogs } = window as any;
      if (typeof getCustomTableLogs === 'function') {
        componentLogs.customTable = getCustomTableLogs();
      }
    } catch (error: unknown) {
      // ✅ Silently handle log collection errors (avoid blocking export functionality), but log warning
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[LogExporter] Failed to collect CustomTable logs',
          errorObj.message,
        );
      }
    }

    // Filters logs
    try {
      const { getFiltersLogs } = window as any;
      if (typeof getFiltersLogs === 'function') {
        componentLogs.filters = getFiltersLogs();
      }
    } catch (error: unknown) {
      // ✅ Silently handle log collection errors (avoid blocking export functionality), but log warning
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[LogExporter] Failed to collect Filters logs',
          errorObj.message,
        );
      }
    }

    // QuerySync logs
    try {
      const { getQuerySyncLogs } = window as any;
      if (typeof getQuerySyncLogs === 'function') {
        componentLogs.querySync = getQuerySyncLogs();
      }
    } catch (error: unknown) {
      // ✅ Silently handle log collection errors (avoid blocking export functionality), but log warning
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[LogExporter] Failed to collect QuerySync logs',
          errorObj.message,
        );
      }
    }

    // TableFilter logs
    try {
      const { getTableFilterLogs } = window as any;
      if (typeof getTableFilterLogs === 'function') {
        componentLogs.tableFilter = getTableFilterLogs();
      }
    } catch (error: unknown) {
      // ✅ Silently handle log collection errors (avoid blocking export functionality), but log warning
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[LogExporter] Failed to collect TableFilter logs',
          errorObj.message,
        );
      }
    }

    // Guide logs (via guideLogger)
    try {
      const guideLogger = (window as any).__guideLogger;
      if (guideLogger && typeof guideLogger.getAllLogs === 'function') {
        componentLogs.guide = guideLogger.getAllLogs();
      }
    } catch (error: unknown) {
      // ✅ Silently handle log collection errors (avoid blocking export functionality), but log warning
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[LogExporter] Failed to collect Guide logs',
          errorObj.message,
        );
      }
    }

    // SelectBlock logs
    try {
      const selectBlockLogger = (window as any).__selectBlockLogger;
      if (
        selectBlockLogger &&
        typeof selectBlockLogger.getLogs === 'function'
      ) {
        componentLogs.selectBlock = selectBlockLogger.getLogs();
      }
    } catch (error: unknown) {
      // ✅ Silently handle log collection errors (avoid blocking export functionality), but log warning
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[LogExporter] Failed to collect SelectBlock logs',
          errorObj.message,
        );
      }
    }
  }

  // Calculate total log count
  const totalComponentLogs = Object.values(componentLogs).reduce(
    (sum: number, logs: unknown) =>
      sum + (Array.isArray(logs) ? logs.length : 0),
    0,
  );

  const totalEnhancedLogs =
    (Array.isArray(enhancedLogs.apiRequests)
      ? enhancedLogs.apiRequests.length
      : 0) +
    (Array.isArray(enhancedLogs.userActions)
      ? enhancedLogs.userActions.length
      : 0);

  return {
    unifiedLogs,
    enhancedLogs,
    componentLogs,
    metadata: {
      exportTime: new Date().toISOString(),
      sessionId: logger.getSessionId(),
      totalUnifiedLogs: unifiedLogs.length,
      totalEnhancedLogs,
      totalComponentLogs,
    },
  };
}

/**
 * Format logs as text format
 */
function formatLogsAsText(allLogs: ReturnType<typeof collectAllLogs>): string {
  const { unifiedLogs, enhancedLogs, componentLogs, metadata } = allLogs;

  const header = [
    'VeAIOps Unified Log Export',
    `Export Time: ${metadata.exportTime}`,
    `Session ID: ${metadata.sessionId}`,
    `Unified Logs: ${metadata.totalUnifiedLogs}`,
    `Enhanced Logs: ${metadata.totalEnhancedLogs}`,
    `Component Logs: ${metadata.totalComponentLogs}`,
    '='.repeat(80),
    '',
  ].join('\n');

  // Format unified logs
  const unifiedSection = [
    '## Unified Logger Logs',
    '='.repeat(80),
    ...unifiedLogs.map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const prefix = `[${timestamp}][${log.level.toUpperCase()}][${log.source}${
        log.component ? `/${log.component}` : ''
      }]`;
      const dataStr = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
      return `${prefix} ${log.message}${dataStr}`;
    }),
    '',
  ].join('\n');

  // Format enhanced logs
  const enhancedSections: string[] = [];

  if (enhancedLogs.apiRequests && enhancedLogs.apiRequests.length > 0) {
    enhancedSections.push(
      '## Enhanced Collector - API Request Logs',
      '='.repeat(80),
      ...enhancedLogs.apiRequests.map((request: any) => {
        const timestamp = request.startTime
          ? new Date(request.startTime).toISOString()
          : new Date().toISOString();
        const duration = request.duration
          ? ` (Duration: ${request.duration}ms)`
          : '';
        const status = request.status
          ? ` [${request.status} ${request.statusText || ''}]`
          : '';
        return `[${timestamp}] ${request.method} ${request.url}${status}${duration}`;
      }),
      '',
    );
  }

  if (enhancedLogs.userActions && enhancedLogs.userActions.length > 0) {
    enhancedSections.push(
      '## Enhanced Collector - User Action Logs',
      '='.repeat(80),
      ...enhancedLogs.userActions.map((action: any) => {
        const timestamp = action.timestamp
          ? new Date(action.timestamp).toISOString()
          : new Date().toISOString();
        return `[${timestamp}] ${action.type} - ${action.target || ''} - ${action.url || ''}`;
      }),
      '',
    );
  }

  if (enhancedLogs.performanceMetrics) {
    enhancedSections.push(
      '## Enhanced Collector - Performance Metrics',
      '='.repeat(80),
      JSON.stringify(enhancedLogs.performanceMetrics, null, 2),
      '',
    );
  }

  // Format component logs
  const componentSections: string[] = [];

  Object.entries(componentLogs).forEach(([name, logs]) => {
    if (Array.isArray(logs) && logs.length > 0) {
      componentSections.push(
        `## ${name} Component Logs`,
        '='.repeat(80),
        ...logs.map((log: any) => {
          const timestamp = log.timestamp
            ? new Date(log.timestamp).toISOString()
            : new Date().toISOString();
          const level = log.level || 'info';
          const message = log.message || log.action || '';
          const data = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
          return `[${timestamp}][${level.toUpperCase()}] ${message}${data}`;
        }),
        '',
      );
    }
  });

  return [
    header,
    unifiedSection,
    ...enhancedSections,
    ...componentSections,
  ].join('\n');
}

/**
 * Export logs in specified time range
 * @param startTime Start time (timestamp)
 * @param endTime End time (timestamp), if not provided use current time
 * @param formatOrFilename Export format: 'json' | 'text', or directly pass custom filename (backward compatible)
 */
export function exportLogsInTimeRange(
  startTime: number,
  endTime?: number,
  formatOrFilename: 'json' | 'text' | string = 'json',
): void {
  // If endTime is not provided, use current time
  const actualEndTime = endTime ?? Date.now();

  const logs = logger.getLogsInRange({ startTime, endTime: actualEndTime });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  let content: string;
  let filename: string;
  let mimeType: string;

  // If filename is passed (contains .json or .txt/.log extension), determine format by extension
  if (formatOrFilename.includes('.json')) {
    filename = formatOrFilename;
    content = JSON.stringify(
      {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(actualEndTime).toISOString(),
        totalLogs: logs.length,
        logs,
      },
      null,
      2,
    );
    mimeType = 'application/json';
  } else if (
    formatOrFilename.includes('.txt') ||
    formatOrFilename.includes('.log')
  ) {
    filename = formatOrFilename;
    const header = [
      'VeAIOps Time Range Log Export',
      `Start Time: ${new Date(startTime).toISOString()}`,
      `End Time: ${new Date(actualEndTime).toISOString()}`,
      `Log Count: ${logs.length}`,
      '='.repeat(80),
      '',
    ].join('\n');
    const logLines = logs.map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const prefix = `[${timestamp}][${log.level.toUpperCase()}][${log.source}${
        log.component ? `/${log.component}` : ''
      }]`;
      const dataStr = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
      return `${prefix} ${log.message}${dataStr}`;
    });
    content = header + logLines.join('\n');
    mimeType = 'text/plain;charset=utf-8';
  } else if (formatOrFilename === 'json') {
    content = JSON.stringify(
      {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(actualEndTime).toISOString(),
        totalLogs: logs.length,
        logs,
      },
      null,
      2,
    );
    filename = `veaiops-logs-${timestamp}.json`;
    mimeType = 'application/json';
  } else {
    const header = [
      'VeAIOps Time Range Log Export',
      `Start Time: ${new Date(startTime).toISOString()}`,
      `End Time: ${new Date(actualEndTime).toISOString()}`,
      `Log Count: ${logs.length}`,
      '='.repeat(80),
      '',
    ].join('\n');
    const logLines = logs.map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const prefix = `[${timestamp}][${log.level.toUpperCase()}][${log.source}${
        log.component ? `/${log.component}` : ''
      }]`;
      const dataStr = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
      return `${prefix} ${log.message}${dataStr}`;
    });
    content = header + logLines.join('\n');
    filename = `veaiops-logs-${timestamp}.txt`;
    mimeType = 'text/plain;charset=utf-8';
  }

  // Create download link
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
