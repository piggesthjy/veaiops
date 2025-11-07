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

import type { PerformanceAnalysis } from './types';

/**
 * 分析性能
 */
export function analyzePerformance(): PerformanceAnalysis {
  const analysis: PerformanceAnalysis = {
    timing: {},
    memory: {},
    issues: [],
  };

  try {
    // 获取页面加载时间
    if (performance.timing) {
      analysis.timing = {
        loadTime:
          performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded:
          performance.timing.domContentLoadedEventEnd -
          performance.timing.navigationStart,
        firstPaint: performance
          .getEntriesByType('paint')
          .find((entry) => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance
          .getEntriesByType('paint')
          .find((entry) => entry.name === 'first-contentful-paint')?.startTime,
      };
    }

    // 获取内存使用情况
    if ((performance as any).memory) {
      analysis.memory = {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }

    // 检查是否有长时间运行的任务
    const longTasks = performance.getEntriesByType('longtask');
    if (longTasks.length > 0) {
      analysis.issues.push({
        type: 'long_task',
        message: '发现长时间运行的任务',
        severity: 'warning',
        tasks: longTasks.map((task) => ({
          duration: task.duration,
          startTime: task.startTime,
        })),
      });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '性能分析失败';
    analysis.issues.push({
      type: 'performance_analysis_error',
      message: `性能分析失败: ${errorMessage}`,
      severity: 'error',
      error: (error as Error).message,
    });
  }

  return analysis;
}
