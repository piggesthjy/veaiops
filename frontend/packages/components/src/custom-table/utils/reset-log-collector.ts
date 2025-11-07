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
 * 重置操作日志收集器
 * 专门用于收集和分析重置按钮触发的完整调用链路日志
 */

import { logger } from '@veaiops/utils';
import { performanceLogger } from './performance-logger';

export interface ResetLogEntry {
  timestamp: number;
  component: string;
  method: string;
  action: 'start' | 'end' | 'call' | 'error';
  data?: Record<string, unknown>;
  stackTrace?: string;
  duration?: number;
}

export interface ResetLogParams {
  component: string;
  method: string;
  action: ResetLogEntry['action'];
  data?: Record<string, unknown>;
  stackTrace?: string;
}

export interface ResetLogSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  logs: ResetLogEntry[];
  summary: {
    totalSteps: number;
    totalDuration: number;
    errorCount: number;
    components: string[];
  };
}

class ResetLogCollector {
  private sessions: Map<string, ResetLogSession> = new Map();
  private currentSessionId: string | null = null;
  private enabled = false;

  /**
   * 启用日志收集
   */
  enable(): void {
    this.enabled = true;
    logger.info({
      message: '[ResetLogCollector] 重置日志收集已启用',
      data: {},
      source: 'ResetLogCollector',
      component: 'enable',
    });
  }

  /**
   * 禁用日志收集
   */
  disable(): void {
    this.enabled = false;
    logger.info({
      message: '[ResetLogCollector] 重置日志收集已禁用',
      data: {},
      source: 'ResetLogCollector',
      component: 'disable',
    });
  }

  /**
   * 开始新的重置会话
   */
  startSession(sessionId?: string): string {
    if (!this.enabled) {
      return '';
    }

    const id =
      sessionId ||
      `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: ResetLogSession = {
      sessionId: id,
      startTime: Date.now(),
      logs: [],
      summary: {
        totalSteps: 0,
        totalDuration: 0,
        errorCount: 0,
        components: [],
      },
    };

    this.sessions.set(id, session);
    this.currentSessionId = id;

    this.log({
      component: 'ResetLogCollector',
      method: 'startSession',
      action: 'start',
      data: {
        sessionId: id,
        timestamp: new Date().toISOString(),
      },
    });

    logger.info({
      message: `[ResetLogCollector] 开始重置会话: ${id}`,
      data: { sessionId: id },
      source: 'ResetLogCollector',
      component: 'startSession',
    });
    return id;
  }

  /**
   * 结束当前会话
   */
  endSession(): void {
    if (!this.enabled || !this.currentSessionId) {
      return;
    }

    const session = this.sessions.get(this.currentSessionId);
    if (!session) {
      return;
    }

    session.endTime = Date.now();
    session.summary.totalDuration = session.endTime - session.startTime;
    session.summary.totalSteps = session.logs.length;
    session.summary.components = [
      ...new Set(session.logs.map((log) => log.component)),
    ];

    this.log({
      component: 'ResetLogCollector',
      method: 'endSession',
      action: 'end',
      data: {
        sessionId: this.currentSessionId,
        summary: session.summary,
      },
    });

    logger.info({
      message: `[ResetLogCollector] 结束重置会话: ${this.currentSessionId}`,
      data: { sessionId: this.currentSessionId, summary: session.summary },
      source: 'ResetLogCollector',
      component: 'endSession',
    });
    this.currentSessionId = null;
  }

  /**
   * 记录重置相关日志
   */
  log({ component, method, action, data, stackTrace }: ResetLogParams): void {
    if (!this.enabled || !this.currentSessionId) {
      return;
    }

    const session = this.sessions.get(this.currentSessionId);
    if (!session) {
      return;
    }

    const entry: ResetLogEntry = {
      timestamp: Date.now(),
      component,
      method,
      action,
      data,
      stackTrace,
    };

    // 计算持续时间（如果是结束动作）
    if (action === 'end') {
      const startLog = session.logs
        .reverse()
        .find(
          (log) =>
            log.component === component &&
            log.method === method &&
            log.action === 'start',
        );
      if (startLog) {
        entry.duration = entry.timestamp - startLog.timestamp;
      }
    }

    session.logs.push(entry);

    // 更新摘要
    if (action === 'error') {
      session.summary.errorCount++;
    }

    // ✅ 统一使用 @veaiops/utils logger（logger 内部已处理 console 输出）
    const prefix = `[${component}.${method}]`;
    const message = `${action.toUpperCase()}`;

    switch (action) {
      case 'start': {
        logger.debug({
          message: `${message}`,
          data,
          source: 'ResetLogCollector',
          component: `${component}.${method}`,
        });
        break;
      }
      case 'end': {
        const endMessage = `${message}${entry.duration ? ` (${entry.duration}ms)` : ''}`;
        logger.debug({
          message: endMessage,
          data,
          source: 'ResetLogCollector',
          component: `${component}.${method}`,
        });
        break;
      }
      case 'call': {
        logger.debug({
          message: `调用: ${message}`,
          data,
          source: 'ResetLogCollector',
          component: `${component}.${method}`,
        });
        break;
      }
      case 'error': {
        logger.error({
          message: `错误: ${message}`,
          data: { data, stackTrace },
          source: 'ResetLogCollector',
          component: `${component}.${method}`,
        });
        break;
      }
      default:
        // No action
        break;
    }
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): ResetLogSession | null {
    if (!this.currentSessionId) {
      return null;
    }
    return this.sessions.get(this.currentSessionId) || null;
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): ResetLogSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 导出重置日志
   */
  exportResetLogs(): void {
    const sessions = this.getAllSessions();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `custom-table-reset-logs-${timestamp}.json`;

    const exportData = {
      metadata: {
        exportTime: new Date().toISOString(),
        totalSessions: sessions.length,
        collectorVersion: '1.0.0',
      },
      sessions,
      performanceLogs:
        (performanceLogger as { getLogs?: () => unknown }).getLogs?.() || [],
    };

    // 创建下载链接
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.info({
      message: `[ResetLogCollector] 重置日志已导出: ${filename}`,
      data: { filename },
      source: 'ResetLogCollector',
      component: 'exportResetLogs',
    });
  }

  /**
   * 清空所有会话
   */
  clear(): void {
    this.sessions.clear();
    this.currentSessionId = null;
    logger.info({
      message: '[ResetLogCollector] 所有会话已清空',
      data: undefined,
      source: 'ResetLogCollector',
      component: 'clear',
    });
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSessions: number;
    totalLogs: number;
    averageSessionDuration: number;
    errorRate: number;
    mostActiveComponents: Array<{ component: string; count: number }>;
  } {
    const sessions = this.getAllSessions();
    const totalLogs = sessions.reduce(
      (sum, session) => sum + session.logs.length,
      0,
    );
    const totalErrors = sessions.reduce(
      (sum, session) => sum + session.summary.errorCount,
      0,
    );
    const totalDuration = sessions.reduce(
      (sum, session) => sum + session.summary.totalDuration,
      0,
    );

    // 统计最活跃的组件
    const componentCounts = new Map<string, number>();
    sessions.forEach((session) => {
      session.logs.forEach((log) => {
        const count = componentCounts.get(log.component) || 0;
        componentCounts.set(log.component, count + 1);
      });
    });

    const mostActiveComponents = Array.from(componentCounts.entries())
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions: sessions.length,
      totalLogs,
      averageSessionDuration:
        sessions.length > 0 ? totalDuration / sessions.length : 0,
      errorRate: totalLogs > 0 ? (totalErrors / totalLogs) * 100 : 0,
      mostActiveComponents,
    };
  }
}

// 创建全局实例
export const resetLogCollector = new ResetLogCollector();

// 开发环境下自动暴露到全局
if (process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).resetLogCollector = {
    enable: () => resetLogCollector.enable(),
    disable: () => resetLogCollector.disable(),
    startSession: (id?: string) => resetLogCollector.startSession(id),
    endSession: () => resetLogCollector.endSession(),
    export: () => resetLogCollector.exportResetLogs(),
    clear: () => resetLogCollector.clear(),
    stats: () => resetLogCollector.getStats(),
    getCurrentSession: () => resetLogCollector.getCurrentSession(),
  };
}

/**
 * 重置操作装饰器
 * 自动记录方法的开始和结束
 */
export function withResetLogging<T extends (...args: unknown[]) => unknown>(
  target: unknown,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>,
): TypedPropertyDescriptor<T> {
  const originalMethod = descriptor.value!;

  descriptor.value = ((...args: unknown[]) => {
    const component =
      (target as { constructor?: { name?: string } }).constructor?.name ||
      'Unknown';
    const method = propertyName;

    // 记录开始
    resetLogCollector.log({
      component,
      method,
      action: 'start',
      data: {
        arguments: args,
        timestamp: new Date().toISOString(),
      },
    });

    try {
      const result = originalMethod.apply(target, args);

      // 如果是 Promise，等待完成
      if (
        result &&
        typeof result === 'object' &&
        'then' in result &&
        typeof (result as { then: unknown }).then === 'function'
      ) {
        return (result as Promise<unknown>)
          .then((res: unknown) => {
            resetLogCollector.log({
              component,
              method,
              action: 'end',
              data: {
                result: res,
                timestamp: new Date().toISOString(),
              },
            });
            return res;
          })
          .catch((error: unknown) => {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            resetLogCollector.log({
              component,
              method,
              action: 'error',
              data: {
                error: errorMessage,
                stack: errorStack,
                timestamp: new Date().toISOString(),
              },
            });
            throw error;
          });
      }

      // 同步方法
      resetLogCollector.log({
        component,
        method,
        action: 'end',
        data: {
          result,
          timestamp: new Date().toISOString(),
        },
      });

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      resetLogCollector.log({
        component,
        method,
        action: 'error',
        data: {
          error: errorMessage,
          stack: errorStack,
          timestamp: new Date().toISOString(),
        },
      });
      throw error;
    }
  }) as T;

  return descriptor;
}

/**
 * React Hook for reset logging
 */
export function useResetLogging(componentName: string) {
  return {
    logStart: (method: string, data?: Record<string, unknown>) => {
      resetLogCollector.log({
        component: componentName,
        method,
        action: 'start',
        data,
      });
    },
    logEnd: (method: string, data?: Record<string, unknown>) => {
      resetLogCollector.log({
        component: componentName,
        method,
        action: 'end',
        data,
      });
    },
    logCall: (method: string, data?: Record<string, unknown>) => {
      resetLogCollector.log({
        component: componentName,
        method,
        action: 'call',
        data,
      });
    },
    logError: (
      method: string,
      error: Error,
      data?: Record<string, unknown>,
    ) => {
      resetLogCollector.log({
        component: componentName,
        method,
        action: 'error',
        data: {
          ...data,
          error: error.message,
        },
        stackTrace: error.stack,
      });
    },
  };
}
