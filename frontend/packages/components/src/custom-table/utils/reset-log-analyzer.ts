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
 * 重置日志分析工具
 * 提供日志数据的深度分析和可视化功能
 */

import {
  type ResetLogEntry,
  type ResetLogSession,
  resetLogCollector,
} from './reset-log-collector';

export interface LogAnalysisResult {
  /** 会话概览 */
  sessionOverview: {
    totalSessions: number;
    averageDuration: number;
    successRate: number;
    errorRate: number;
  };

  /** 组件性能分析 */
  componentAnalysis: Array<{
    component: string;
    method: string;
    callCount: number;
    averageDuration: number;
    errorCount: number;
    successRate: number;
  }>;

  /** 调用链路分析 */
  callChainAnalysis: Array<{
    sessionId: string;
    chain: Array<{
      component: string;
      method: string;
      timestamp: number;
      duration?: number;
      success: boolean;
    }>;
    totalDuration: number;
    success: boolean;
  }>;

  /** 错误分析 */
  errorAnalysis: Array<{
    component: string;
    method: string;
    errorMessage: string;
    occurrenceCount: number;
    sessions: string[];
  }>;

  /** 性能瓶颈 */
  performanceBottlenecks: Array<{
    component: string;
    method: string;
    averageDuration: number;
    maxDuration: number;
    callCount: number;
  }>;
}

/**
 * 重置日志分析器
 */
export class ResetLogAnalyzer {
  /**
   * 分析所有会话的日志数据
   */
  analyzeLogs(): LogAnalysisResult {
    const sessions = resetLogCollector.getAllSessions();

    if (sessions.length === 0) {
      return this.getEmptyResult();
    }

    return {
      sessionOverview: this.analyzeSessionOverview(sessions),
      componentAnalysis: this.analyzeComponentPerformance(sessions),
      callChainAnalysis: this.analyzeCallChains(sessions),
      errorAnalysis: this.analyzeErrors(sessions),
      performanceBottlenecks: this.analyzePerformanceBottlenecks(sessions),
    };
  }

  /**
   * 分析会话概览
   */
  private analyzeSessionOverview(sessions: ResetLogSession[]) {
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce(
      (sum, session) => sum + session.summary.totalDuration,
      0,
    );
    const totalErrors = sessions.reduce(
      (sum, session) => sum + session.summary.errorCount,
      0,
    );
    const totalSteps = sessions.reduce(
      (sum, session) => sum + session.summary.totalSteps,
      0,
    );

    return {
      totalSessions,
      averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      successRate:
        totalSteps > 0 ? ((totalSteps - totalErrors) / totalSteps) * 100 : 100,
      errorRate: totalSteps > 0 ? (totalErrors / totalSteps) * 100 : 0,
    };
  }

  /**
   * 分析组件性能
   */
  private analyzeComponentPerformance(sessions: ResetLogSession[]) {
    const componentStats = new Map<
      string,
      Map<
        string,
        {
          callCount: number;
          totalDuration: number;
          errorCount: number;
          durations: number[];
        }
      >
    >();

    // 收集统计数据
    sessions.forEach((session) => {
      session.logs.forEach((log) => {
        if (!componentStats.has(log.component)) {
          componentStats.set(log.component, new Map());
        }

        const methodStats = componentStats.get(log.component)!;
        if (!methodStats.has(log.method)) {
          methodStats.set(log.method, {
            callCount: 0,
            totalDuration: 0,
            errorCount: 0,
            durations: [],
          });
        }

        const stats = methodStats.get(log.method)!;
        stats.callCount++;

        if (log.duration !== undefined) {
          stats.totalDuration += log.duration;
          stats.durations.push(log.duration);
        }

        if (log.action === 'error') {
          stats.errorCount++;
        }
      });
    });

    // 生成分析结果
    const result: LogAnalysisResult['componentAnalysis'] = [];

    componentStats.forEach((methodStats, component) => {
      methodStats.forEach((stats, method) => {
        result.push({
          component,
          method,
          callCount: stats.callCount,
          averageDuration:
            stats.callCount > 0 ? stats.totalDuration / stats.callCount : 0,
          errorCount: stats.errorCount,
          successRate:
            stats.callCount > 0
              ? ((stats.callCount - stats.errorCount) / stats.callCount) * 100
              : 100,
        });
      });
    });

    return result.sort((a, b) => b.callCount - a.callCount);
  }

  /**
   * 分析调用链路
   */
  private analyzeCallChains(sessions: ResetLogSession[]) {
    return sessions.map((session) => {
      const chain = session.logs
        .filter(
          (log) =>
            log.action === 'start' ||
            log.action === 'end' ||
            log.action === 'error',
        )
        .map((log) => ({
          component: log.component,
          method: log.method,
          timestamp: log.timestamp,
          duration: log.duration,
          success: log.action !== 'error',
        }));

      return {
        sessionId: session.sessionId,
        chain,
        totalDuration: session.summary.totalDuration,
        success: session.summary.errorCount === 0,
      };
    });
  }

  /**
   * 分析错误
   */
  private analyzeErrors(sessions: ResetLogSession[]) {
    const errorMap = new Map<
      string,
      {
        component: string;
        method: string;
        errorMessage: string;
        occurrenceCount: number;
        sessions: Set<string>;
      }
    >();

    sessions.forEach((session) => {
      session.logs
        .filter((log) => log.action === 'error')
        .forEach((log) => {
          let errorMsg = 'unknown';
          if (log.data?.error instanceof Error) {
            errorMsg = log.data.error.message;
          } else if (typeof log.data?.error === 'string') {
            errorMsg = log.data.error;
          } else if (log.data?.error != null) {
            errorMsg = JSON.stringify(log.data.error);
          }
          const errorKey = `${log.component}.${log.method}.${errorMsg}`;

          if (!errorMap.has(errorKey)) {
            errorMap.set(errorKey, {
              component: log.component,
              method: log.method,
              errorMessage: (log.data?.error as string) || 'Unknown error',
              occurrenceCount: 0,
              sessions: new Set(),
            });
          }

          const error = errorMap.get(errorKey)!;
          error.occurrenceCount++;
          error.sessions.add(session.sessionId);
        });
    });

    return Array.from(errorMap.values())
      .map((error) => ({
        ...error,
        sessions: Array.from(error.sessions),
      }))
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }

  /**
   * 分析性能瓶颈
   */
  private analyzePerformanceBottlenecks(sessions: ResetLogSession[]) {
    const componentStats = new Map<
      string,
      Map<
        string,
        {
          durations: number[];
          callCount: number;
        }
      >
    >();

    // 收集持续时间数据
    sessions.forEach((session) => {
      session.logs
        .filter((log) => log.duration !== undefined)
        .forEach((log) => {
          if (!componentStats.has(log.component)) {
            componentStats.set(log.component, new Map());
          }

          const methodStats = componentStats.get(log.component)!;
          if (!methodStats.has(log.method)) {
            methodStats.set(log.method, {
              durations: [],
              callCount: 0,
            });
          }

          const stats = methodStats.get(log.method)!;
          stats.durations.push(log.duration!);
          stats.callCount++;
        });
    });

    // 计算性能指标
    const result: LogAnalysisResult['performanceBottlenecks'] = [];

    componentStats.forEach((methodStats, component) => {
      methodStats.forEach((stats, method) => {
        const durations = stats.durations.sort((a, b) => a - b);
        const averageDuration =
          durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const maxDuration = durations[durations.length - 1];

        result.push({
          component,
          method,
          averageDuration,
          maxDuration,
          callCount: stats.callCount,
        });
      });
    });

    return result
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10); // 返回前10个性能瓶颈
  }

  /**
   * 获取空结果
   */
  private getEmptyResult(): LogAnalysisResult {
    return {
      sessionOverview: {
        totalSessions: 0,
        averageDuration: 0,
        successRate: 100,
        errorRate: 0,
      },
      componentAnalysis: [],
      callChainAnalysis: [],
      errorAnalysis: [],
      performanceBottlenecks: [],
    };
  }

  /**
   * 生成分析报告
   */
  generateReport(): string {
    const analysis = this.analyzeLogs();

    let report = '# CustomTable 重置操作分析报告\n\n';
    report += `生成时间: ${new Date().toISOString()}\n\n`;

    // 会话概览
    report += '## 会话概览\n\n';
    report += `- 总会话数: ${analysis.sessionOverview.totalSessions}\n`;
    report += `- 平均持续时间: ${analysis.sessionOverview.averageDuration.toFixed(
      2,
    )}ms\n`;
    report += `- 成功率: ${analysis.sessionOverview.successRate.toFixed(2)}%\n`;
    report += `- 错误率: ${analysis.sessionOverview.errorRate.toFixed(2)}%\n\n`;

    // 组件性能分析
    if (analysis.componentAnalysis.length > 0) {
      report += '## 组件性能分析\n\n';
      report +=
        '| 组件 | 方法 | 调用次数 | 平均耗时(ms) | 错误次数 | 成功率 |\n';
      report +=
        '|------|------|----------|--------------|----------|--------|\n';

      analysis.componentAnalysis.forEach((item) => {
        report += `| ${item.component} | ${item.method} | ${
          item.callCount
        } | ${item.averageDuration.toFixed(2)} | ${
          item.errorCount
        } | ${item.successRate.toFixed(2)}% |\n`;
      });
      report += '\n';
    }

    // 性能瓶颈
    if (analysis.performanceBottlenecks.length > 0) {
      report += '## 性能瓶颈\n\n';
      report += '| 组件 | 方法 | 平均耗时(ms) | 最大耗时(ms) | 调用次数 |\n';
      report += '|------|------|--------------|--------------|----------|\n';

      analysis.performanceBottlenecks.forEach((item) => {
        report += `| ${item.component} | ${
          item.method
        } | ${item.averageDuration.toFixed(2)} | ${item.maxDuration} | ${
          item.callCount
        } |\n`;
      });
      report += '\n';
    }

    // 错误分析
    if (analysis.errorAnalysis.length > 0) {
      report += '## 错误分析\n\n';
      report += '| 组件 | 方法 | 错误信息 | 出现次数 | 影响会话数 |\n';
      report += '|------|------|----------|----------|------------|\n';

      analysis.errorAnalysis.forEach((item) => {
        report += `| ${item.component} | ${item.method} | ${item.errorMessage} | ${item.occurrenceCount} | ${item.sessions.length} |\n`;
      });
      report += '\n';
    }

    return report;
  }

  /**
   * 导出分析报告
   */
  exportAnalysisReport(): void {
    const report = this.generateReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `custom-table-reset-analysis-${timestamp}.md`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[ResetLogAnalyzer] 分析报告已导出: ${filename}`);
  }
}

// 创建全局实例
export const resetLogAnalyzer = new ResetLogAnalyzer();

// 开发环境下自动暴露到全局
if (process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).resetLogAnalyzer = {
    analyze: () => resetLogAnalyzer.analyzeLogs(),
    generateReport: () => resetLogAnalyzer.generateReport(),
    exportReport: () => resetLogAnalyzer.exportAnalysisReport(),
  };
}
