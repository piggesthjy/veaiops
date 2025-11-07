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
 * CustomTable 性能日志收集器
 * @description 收集并分析CustomTable的渲染性能和重渲染情况
 * ✅ 优化：统一使用 @veaiops/utils logger

 *
 */

import { logger } from '@veaiops/utils';
import React from 'react';

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  data?: Record<string, unknown>;
  renderCount?: number;
  duration?: number;
}

interface PerformanceMetrics {
  totalRenders: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  renderFrequency: number; // renders per second
  componentBreakdown: Record<string, number>;
}

class CustomTablePerformanceLogger {
  private logs: LogEntry[] = [];
  private renderCounts: Record<string, number> = {};
  private renderTimes: Record<string, number[]> = {};
  private enabled = false;
  private startTime: number = Date.now();

  /**
   * 启用性能日志收集
   */
  enable(): void {
    this.enabled = true;
    this.startTime = Date.now();
    this.logs = [];
    this.renderCounts = {};
    this.renderTimes = {};
    if (process.env.NODE_ENV === 'development') {
      // Development mode: enable additional logging
    }
  }

  /**
   * 禁用性能日志收集
   */
  disable(): void {
    this.enabled = false;
    if (process.env.NODE_ENV === 'development') {
      // Development mode: disable additional logging
    }
  }

  /**
   * 记录日志
   */
  log({
    level,
    component,
    message,
    data,
  }: {
    level: LogEntry['level'];
    component: string;
    message: string;
    data?: Record<string, unknown>;
  }): void {
    if (!this.enabled) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      component,
      message,
      data,
    };

    this.logs.push(entry);

    // ✅ 统一使用 @veaiops/utils logger（logger 内部已处理 console 输出）
    const logData = data ? { data } : undefined;
    switch (level) {
      case 'error':
        logger.error({
          message,
          data: logData,
          source: 'CustomTable',
          component: `Performance/${component}`,
        });
        break;
      case 'warn':
        logger.warn({
          message,
          data: logData,
          source: 'CustomTable',
          component: `Performance/${component}`,
        });
        break;
      case 'debug':
        logger.debug({
          message,
          data: logData,
          source: 'CustomTable',
          component: `Performance/${component}`,
        });
        break;
      default:
        logger.info({
          message,
          data: logData,
          source: 'CustomTable',
          component: `Performance/${component}`,
        });
        break;
    }
  }

  /**
   * 记录组件渲染
   */
  logRender({
    component,
    duration,
  }: { component: string; duration?: number }): void {
    if (!this.enabled) {
      return;
    }

    // 更新渲染计数
    this.renderCounts[component] = (this.renderCounts[component] || 0) + 1;

    // 记录渲染时间
    if (duration !== undefined) {
      if (!this.renderTimes[component]) {
        this.renderTimes[component] = [];
      }
      this.renderTimes[component].push(duration);
    }

    this.log({
      level: 'debug',
      component,
      message: '组件渲染',
      data: {
        renderCount: this.renderCounts[component],
        duration,
      },
    });
  }

  /**
   * 开始计时
   */
  startTimer(): number {
    return performance.now();
  }

  /**
   * 结束计时并记录
   */
  endTimer({
    component,
    startTime,
  }: { component: string; startTime: number }): number {
    const duration = performance.now() - startTime;
    this.logRender({ component, duration });
    return duration;
  }

  /**
   * 生成性能报告
   */
  generateReport(): PerformanceMetrics & { logs: LogEntry[] } {
    const totalDuration = Date.now() - this.startTime;
    const totalRenders = Object.values(this.renderCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    // 计算平均渲染时间
    const allRenderTimes = Object.values(this.renderTimes).flat();
    const averageRenderTime =
      allRenderTimes.length > 0
        ? allRenderTimes.reduce((sum, time) => sum + time, 0) /
          allRenderTimes.length
        : 0;

    const maxRenderTime =
      allRenderTimes.length > 0 ? Math.max(...allRenderTimes) : 0;
    const minRenderTime =
      allRenderTimes.length > 0 ? Math.min(...allRenderTimes) : 0;

    // 渲染频率 (每秒渲染次数)
    const renderFrequency = totalRenders / (totalDuration / 1000);

    return {
      totalRenders,
      averageRenderTime,
      maxRenderTime,
      minRenderTime,
      renderFrequency,
      componentBreakdown: { ...this.renderCounts },
      logs: [...this.logs],
    };
  }

  /**
   * 导出日志到文件
   */
  exportLogs(): void {
    const report = this.generateReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `custom-table-performance-${timestamp}.json`;

    const exportData = {
      metadata: {
        exportTime: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        totalLogs: this.logs.length,
      },
      performance: {
        totalRenders: report.totalRenders,
        averageRenderTime: report.averageRenderTime,
        maxRenderTime: report.maxRenderTime,
        minRenderTime: report.minRenderTime,
        renderFrequency: report.renderFrequency,
        componentBreakdown: report.componentBreakdown,
      },
      logs: report.logs,
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

    this.printSummary(report);
  }

  /**
   * 打印性能摘要
   */
  private printSummary(report: PerformanceMetrics): void {
    console.group('[CustomTable Performance] 📊 性能摘要');

    Object.entries(report.componentBreakdown).forEach(([component, count]) => {
      console.log(`  ${component}: ${count} 次渲染`);
    });
    console.groupEnd();
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
    this.renderCounts = {};
    this.renderTimes = {};
    this.startTime = Date.now();
  }

  /**
   * 获取当前统计信息
   */
  getStats(): PerformanceMetrics {
    const report = this.generateReport();
    return {
      totalRenders: report.totalRenders,
      averageRenderTime: report.averageRenderTime,
      maxRenderTime: report.maxRenderTime,
      minRenderTime: report.minRenderTime,
      renderFrequency: report.renderFrequency,
      componentBreakdown: report.componentBreakdown,
    };
  }
}

// 创建全局实例
export const performanceLogger = new CustomTablePerformanceLogger();

// 开发环境下自动暴露到全局
if (process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).customTablePerformance = {
    enable: () => performanceLogger.enable(),
    disable: () => performanceLogger.disable(),
    export: () => performanceLogger.exportLogs(),
    clear: () => performanceLogger.clear(),
    stats: () => performanceLogger.getStats(),
    report: () => performanceLogger.generateReport(),
  };

  // 暴露日志获取接口给统一日志导出系统
  (window as any).getCustomTableLogs = () => {
    return performanceLogger.generateReport().logs;
  };
}

// 性能监控装饰器

export interface WithPerformanceLoggingParams<
  T extends React.ComponentType<any>,
> {
  Component: T;
  componentName: string;
}

export function withPerformanceLogging<T extends React.ComponentType<any>>({
  Component,
  componentName,
}: WithPerformanceLoggingParams<T>): T {
  const WrappedComponent = React.forwardRef<any, React.ComponentProps<T>>(
    (props, ref) => {
      const startTime = React.useRef<number>();

      // 渲染开始
      startTime.current = performanceLogger.startTimer();

      // 渲染结束
      React.useEffect(() => {
        if (startTime.current !== undefined) {
          performanceLogger.endTimer({
            component: componentName,
            startTime: startTime.current,
          });
        }
      });

      return React.createElement(Component, { ...props, ref });
    },
  );

  WrappedComponent.displayName = `withPerformanceLogging(${componentName})`;

  return WrappedComponent as unknown as T;
}

// React Hook for performance logging
export function usePerformanceLogging(componentName: string): {
  startTimer: () => number;
  endTimer: (startTime: number) => void;
  log: (params: {
    level: LogEntry['level'];
    message: string;
    data?: Record<string, unknown>;
  }) => void;
} {
  return {
    startTimer: () => performanceLogger.startTimer(),
    endTimer: (startTime: number) =>
      performanceLogger.endTimer({ component: componentName, startTime }),
    log: ({
      level,
      message,
      data,
    }: {
      level: LogEntry['level'];
      message: string;
      data?: Record<string, unknown>;
    }) =>
      performanceLogger.log({ level, component: componentName, message, data }),
  };
}
