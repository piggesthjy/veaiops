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
 * Enhanced log collector
 * Automatically collects context information, API requests, performance metrics, user behavior, etc.
 *
 * Note: This module does not directly import logger to avoid circular dependency
 * logger will be used via parameter passing or lazy initialization
 */

import type { LogEntry } from './core';

// Lazy get logger instance to avoid circular dependency
let loggerInstance: any = null;
const getLogger = () => {
  if (loggerInstance === null && typeof window !== 'undefined') {
    try {
      // Get logger instance from window object (logger will be exposed to window on initialization)
      loggerInstance = (window as any).__veaiopsUtilsLogger;
    } catch (error) {
      // If getting fails, return empty object (avoid error)
      loggerInstance = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }
  }
  return loggerInstance;
};

/**
 * Browser environment information
 */
interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  timezone: string;
  cookieEnabled: boolean;
}

/**
 * Page information
 */
interface PageInfo {
  url: string;
  pathname: string;
  search: string;
  hash: string;
  referrer: string;
  title: string;
}

/**
 * API request log
 */
interface ApiRequestLog {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  statusText?: string;
  response?: unknown;
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  pageLoadTime?: number;
  domContentLoadedTime?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  timeToInteractive?: number;
  memoryUsage?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

/**
 * User action log
 */
interface UserActionLog {
  type: 'click' | 'input' | 'submit' | 'navigation' | 'scroll' | 'resize';
  target?: string;
  value?: string;
  url?: string;
  timestamp: number;
}

class EnhancedLoggerCollector {
  private apiRequests: Map<string, ApiRequestLog> = new Map();
  private userActions: UserActionLog[] = [];
  private performanceMetrics: PerformanceMetrics = {};
  private isCollecting = false;

  /**
   * Get browser environment information
   */
  private getBrowserInfo(): BrowserInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: '',
        language: '',
        platform: '',
        screenWidth: 0,
        screenHeight: 0,
        viewportWidth: 0,
        viewportHeight: 0,
        timezone: '',
        cookieEnabled: false,
      };
    }

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
    };
  }

  /**
   * Get page information
   */
  private getPageInfo(): PageInfo {
    if (typeof window === 'undefined') {
      return {
        url: '',
        pathname: '',
        search: '',
        hash: '',
        referrer: '',
        title: '',
      };
    }

    return {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      title: document.title,
    };
  }

  /**
   * Collect performance metrics (private method, collected from browser API)
   */
  private collectPerformanceMetrics(): PerformanceMetrics {
    if (typeof window === 'undefined' || !window.performance) {
      return {};
    }

    const perf = window.performance;
    const navigation = perf.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const paint = perf.getEntriesByType('paint');

    const metrics: PerformanceMetrics = {};

    if (navigation) {
      metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      metrics.domContentLoadedTime =
        navigation.domContentLoadedEventEnd - navigation.fetchStart;
      metrics.timeToInteractive =
        navigation.domInteractive - navigation.fetchStart;
    }

    paint.forEach((entry) => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Memory usage (Chrome specific)
    if ('memory' in performance) {
      const { memory } = performance as any;
      metrics.memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }

    return metrics;
  }

  /**
   * Enhance log entry, add automatically collected context information
   */
  enhanceLogEntry(entry: LogEntry): LogEntry {
    if (!this.isCollecting) {
      return entry;
    }

    const enhancedData = {
      ...entry.data,
      // Browser environment information
      browser: this.getBrowserInfo(),
      // Page information
      page: this.getPageInfo(),
      // Performance metrics (only on first or periodic updates)
      performance: this.performanceMetrics,
    };

    return {
      ...entry,
      data: enhancedData,
    };
  }

  /**
   * Start automatic collection
   */
  startCollection(): void {
    if (this.isCollecting) {
      return;
    }

    this.isCollecting = true;

    // Collect initial performance metrics
    if (typeof window !== 'undefined' && window.performance) {
      this.performanceMetrics = this.collectPerformanceMetrics();
    }

    // Listen to global errors
    this.setupErrorHandlers();

    // Listen to API requests (optional, not enabled by default to avoid too many logs)
    // To enable, call enhancedCollector.enableApiInterceptors()
    // this.setupApiInterceptors();

    // Listen to user behavior (optional, not enabled by default to avoid too many logs)
    // To enable, call enhancedCollector.enableUserActionTracking()
    // this.setupUserActionTracking();

    const logger = getLogger();
    if (logger) {
      logger.info({
        message: 'Enhanced log collection started',
        data: {
          browser: this.getBrowserInfo(),
          page: this.getPageInfo(),
          performance: this.performanceMetrics,
        },
        source: 'EnhancedLoggerCollector',
        component: 'startCollection',
      });
    }
  }

  /**
   * Stop automatic collection
   */
  stopCollection(): void {
    this.isCollecting = false;
    this.apiRequests.clear();
    this.userActions = [];
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Listen to uncaught errors
    window.addEventListener('error', (event) => {
      const logger = getLogger();
      if (logger) {
        logger.error({
          message: 'Uncaught JavaScript error',
          data: {
            error: event.message,
            stack: event.error?.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            errorObj: event.error,
            browser: this.getBrowserInfo(),
            page: this.getPageInfo(),
          },
          source: 'GlobalErrorHandler',
          component: 'window.onerror',
        });
      }
    });

    // Listen to unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const logger = getLogger();
      if (logger) {
        const error =
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason));

        logger.error({
          message: 'Unhandled Promise rejection',
          data: {
            error: error.message,
            stack: error.stack,
            errorObj: error,
            reason: event.reason,
            browser: this.getBrowserInfo(),
            page: this.getPageInfo(),
          },
          source: 'GlobalErrorHandler',
          component: 'unhandledrejection',
        });
      }
    });
  }

  /**
   * Log API request
   */
  logApiRequest(request: ApiRequestLog): void {
    if (!this.isCollecting) {
      return;
    }

    const requestId = `${request.method}_${request.url}_${request.startTime}`;
    this.apiRequests.set(requestId, request);

    // Log request start
    const logger = getLogger();
    if (logger) {
      logger.debug({
        message: `API Request: ${request.method} ${request.url}`,
        data: {
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          startTime: request.startTime,
          browser: this.getBrowserInfo(),
          page: this.getPageInfo(),
        },
        source: 'ApiRequestLogger',
        component: 'logApiRequest',
      });
    }
  }

  /**
   * Log API response
   */
  logApiResponse(
    requestId: string,
    status: number,
    statusText: string,
    response?: unknown,
    error?: Error,
  ): void {
    if (!this.isCollecting) {
      return;
    }

    const request = this.apiRequests.get(requestId);
    if (!request) {
      return;
    }

    const endTime = Date.now();
    const duration = endTime - request.startTime;

    const logData = {
      url: request.url,
      method: request.method,
      status,
      statusText,
      duration,
      startTime: request.startTime,
      endTime,
      response,
      browser: this.getBrowserInfo(),
      page: this.getPageInfo(),
    };

    const logger = getLogger();
    if (logger) {
      if (error) {
        logger.error({
          message: `API Request Failed: ${request.method} ${request.url}`,
          data: {
            ...logData,
            error: error.message,
            stack: error.stack,
            errorObj: error,
          },
          source: 'ApiRequestLogger',
          component: 'logApiResponse',
        });
      } else if (status >= 400) {
        logger.warn({
          message: `API Request Warning: ${request.method} ${request.url} (${status})`,
          data: logData,
          source: 'ApiRequestLogger',
          component: 'logApiResponse',
        });
      } else {
        logger.info({
          message: `API Request Success: ${request.method} ${request.url} (${status})`,
          data: logData,
          source: 'ApiRequestLogger',
          component: 'logApiResponse',
        });
      }
    }

    // Update request record
    request.endTime = endTime;
    request.duration = duration;
    request.status = status;
    request.statusText = statusText;
    request.response = response;
    if (error) {
      request.error = {
        message: error.message,
        stack: error.stack,
      };
    }
  }

  /**
   * Log user action
   */
  logUserAction(action: UserActionLog): void {
    if (!this.isCollecting) {
      return;
    }

    // Limit user action log count to avoid too many logs
    if (this.userActions.length > 100) {
      this.userActions.shift();
    }

    this.userActions.push(action);

    // Only log critical user actions (e.g., submit, navigation)
    if (action.type === 'submit' || action.type === 'navigation') {
      const logger = getLogger();
      if (logger) {
        logger.info({
          message: `User Action: ${action.type}`,
          data: {
            ...action,
            browser: this.getBrowserInfo(),
            page: this.getPageInfo(),
          },
          source: 'UserActionLogger',
          component: 'logUserAction',
        });
      }
    }
  }

  /**
   * Log performance metrics
   */
  logPerformance(metrics: Partial<PerformanceMetrics>): void {
    if (!this.isCollecting) {
      return;
    }

    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };

    const logger = getLogger();
    if (logger) {
      logger.debug({
        message: 'Performance metrics updated',
        data: {
          ...metrics,
          browser: this.getBrowserInfo(),
          page: this.getPageInfo(),
        },
        source: 'PerformanceLogger',
        component: 'logPerformance',
      });
    }
  }

  /**
   * Get all API request logs
   */
  getApiRequests(): ApiRequestLog[] {
    return Array.from(this.apiRequests.values());
  }

  /**
   * Get all user action logs
   */
  getUserActions(): UserActionLog[] {
    return [...this.userActions];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Clear all collected logs
   */
  clear(): void {
    this.apiRequests.clear();
    this.userActions = [];
    this.performanceMetrics = {};
  }

  /**
   * Enable API request interceptors (optional feature)
   * Note: Intercepting fetch requests may affect performance, recommended to enable only during debugging
   */
  enableApiInterceptors(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);
      const method = args[0] instanceof Request ? args[0].method : 'GET';
      const headers: Record<string, string> = {};
      let body: unknown;

      // Extract request information
      if (args[0] instanceof Request) {
        args[0].headers.forEach((value, key) => {
          headers[key] = value;
        });
        try {
          const cloned = args[0].clone();
          body = await cloned.json().catch(() => undefined);
        } catch {
          body = undefined;
        }
      } else if (args[1]) {
        Object.entries(args[1].headers || {}).forEach(([key, value]) => {
          headers[key] = String(value);
        });
        const { body: requestBody } = args[1];
        body = requestBody;
      }

      const startTime = Date.now();
      const requestId = `${method}_${url}_${startTime}`;

      // Log request start
      this.logApiRequest({
        url,
        method,
        headers,
        body,
        startTime,
      });

      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();

        // Extract response information
        let responseData: unknown;
        try {
          const cloned = response.clone();
          responseData = await cloned.json().catch(() => undefined);
        } catch {
          responseData = undefined;
        }

        // Log response
        this.logApiResponse(
          requestId,
          response.status,
          response.statusText,
          responseData,
        );

        return response;
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        this.logApiResponse(requestId, 0, 'Network Error', undefined, errorObj);
        throw error;
      }
    };

    const logger = getLogger();
    if (logger) {
      logger.info({
        message: 'API request interceptor enabled',
        data: {},
        source: 'EnhancedLoggerCollector',
        component: 'enableApiInterceptors',
      });
    }
  }

  /**
   * Enable user action tracking (optional feature)
   * Note: Tracking user behavior may generate a large number of logs, recommended to enable only during debugging
   */
  enableUserActionTracking(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Track click events
    document.addEventListener(
      'click',
      (event) => {
        const target = event.target as HTMLElement;
        this.logUserAction({
          type: 'click',
          target: target?.tagName || 'unknown',
          timestamp: Date.now(),
        });
      },
      true,
    );

    // Track form submissions
    document.addEventListener(
      'submit',
      (event) => {
        const form = event.target as HTMLFormElement;
        this.logUserAction({
          type: 'submit',
          target: form?.id || form?.name || 'form',
          timestamp: Date.now(),
        });
      },
      true,
    );

    // Track page navigation (History API)
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.logUserAction({
        type: 'navigation',
        url: window.location.href,
        timestamp: Date.now(),
      });
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.logUserAction({
        type: 'navigation',
        url: window.location.href,
        timestamp: Date.now(),
      });
    };

    window.addEventListener('popstate', () => {
      this.logUserAction({
        type: 'navigation',
        url: window.location.href,
        timestamp: Date.now(),
      });
    });

    const logger = getLogger();
    if (logger) {
      logger.info({
        message: 'User action tracking enabled',
        data: {},
        source: 'EnhancedLoggerCollector',
        component: 'enableUserActionTracking',
      });
    }
  }
}

// Create global collector instance
export const enhancedCollector = new EnhancedLoggerCollector();

// Expose to window object in browser environment for manual control and auto-start
if (typeof window !== 'undefined') {
  (window as any).__veaiopsEnhancedCollector = enhancedCollector;
  // Note: Auto-start logic is handled in core.ts to avoid circular dependency
}
