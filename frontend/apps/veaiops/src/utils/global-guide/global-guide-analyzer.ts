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

import {
  exportLogsToFile,
  getLogCount,
  logger,
  startLogCollection,
} from '@veaiops/utils';
import { analyzeDOM, logInitialState } from './dom-analyzer';
import {
  analyzeLocalStorage,
  backupLocalStorage,
} from './local-storage-handler';
import { analyzePerformance } from './performance-analyzer';
import { generateRecommendations } from './report-generator';
import type { AnalysisReport } from './types';

/**
 * 全局引导组件拦截问题分析工具
 * 使用日志工具分析首次访问被拦截的原因
 */
class GlobalGuideAnalyzer {
  private isAnalyzing = false;
  private analysisStartTime = 0;
  private localStorageBackup: Record<string, string> = {};

  /**
   * 开始分析
   */
  startAnalysis(): void {
    if (this.isAnalyzing) {
      // ✅ 正确：使用 logger 记录警告，data 参数应为对象或 undefined
      logger.warn({
        message: '分析已在进行中',
        data: undefined,
        source: 'GlobalGuideAnalyzer',
      });
      return;
    }

    this.isAnalyzing = true;
    this.analysisStartTime = Date.now();

    // 备份当前 localStorage 状态
    this.localStorageBackup = backupLocalStorage();

    // 开始收集日志
    startLogCollection();

    logger.info({
      message: '开始分析全局引导组件拦截问题',
      data: {
        startTime: new Date().toISOString(),
        url: window.location.href,
      },
      source: 'GlobalGuideAnalyzer',
    });

    // 记录关键状态
    logInitialState();
  }

  /**
   * 停止分析并导出结果
   */
  stopAnalysis(): void {
    if (!this.isAnalyzing) {
      // ✅ 正确：使用 logger 记录警告，data 参数应为对象或 undefined
      logger.warn({
        message: '没有正在进行的分析',
        data: undefined,
        source: 'GlobalGuideAnalyzer',
      });
      return;
    }

    this.isAnalyzing = false;
    const analysisDuration = Date.now() - this.analysisStartTime;

    logger.info({
      message: '分析完成',
      data: {
        duration: `${analysisDuration}ms`,
        logCount: getLogCount(),
      },
      source: 'GlobalGuideAnalyzer',
    });

    // 导出分析结果
    this.exportAnalysisResults();
  }

  /**
   * 导出分析结果
   */
  private exportAnalysisResults(): void {
    try {
      // 导出日志
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      const filename = `global-guide-analysis-${timestamp}.log`;

      exportLogsToFile(filename);

      // 创建详细的分析报告
      const analysisReport = this.generateAnalysisReport();

      // 将分析报告保存到 localStorage 供后续查看
      const reportKey = `global-guide-analysis-report-${timestamp}`;
      localStorage.setItem(reportKey, JSON.stringify(analysisReport));

      logger.info({
        message: '分析结果已导出',
        data: {
          logFile: filename,
          reportKey,
          reportSize: JSON.stringify(analysisReport).length,
        },
        source: 'GlobalGuideAnalyzer',
      });
    } catch (error) {
      // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: '导出分析结果失败',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'GlobalGuideAnalyzer',
        component: 'exportAnalysisResults',
      });
    }
  }

  /**
   * 生成分析报告
   */
  private generateAnalysisReport(): AnalysisReport {
    return {
      analysisTime: new Date().toISOString(),
      duration: Date.now() - this.analysisStartTime,
      url: window.location.href,
      localStorageBackup: this.localStorageBackup,
      localStorageAnalysis: analyzeLocalStorage(this.localStorageBackup),
      domAnalysis: analyzeDOM(),
      performanceAnalysis: analyzePerformance(),
      recommendations: generateRecommendations(),
    };
  }

  /**
   * 快速诊断
   */
  quickDiagnosis(): void {
    // ✅ 正确：使用 logger 记录信息，data 参数应为对象或 undefined
    logger.info({
      message: '开始快速诊断',
      data: undefined,
      source: 'GlobalGuideAnalyzer',
    });

    // 检查 localStorage
    const guideStore = localStorage.getItem('global-guide-store');
    if (guideStore) {
      try {
        const parsed = JSON.parse(guideStore);
        if ('state' in parsed && 'guideVisible' in parsed.state) {
          logger.error({
            message: '发现问题: guideVisible 被持久化',
            data: {
              value: parsed.state.guideVisible,
              store: parsed,
            },
            source: 'GlobalGuideAnalyzer',
          });
        }
      } catch (error) {
        // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: 'localStorage 解析失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
          source: 'GlobalGuideAnalyzer',
          component: 'quickDiagnosis',
        });
      }
    }

    // 检查 DOM
    const visibleGuideElements = document.querySelectorAll(
      '[class*="global-guide"]:not([style*="display: none"])',
    );
    if (visibleGuideElements.length > 0) {
      logger.error({
        message: '发现问题: 存在可见的引导元素',
        data: {
          count: visibleGuideElements.length,
          elements: Array.from(visibleGuideElements).map((el) => ({
            tagName: el.tagName,
            className: el.className,
          })),
        },
        source: 'GlobalGuideAnalyzer',
        component: 'quickDiagnosis',
      });
    }

    // ✅ 正确：使用 logger 记录信息，data 参数应为对象或 undefined
    logger.info({
      message: '快速诊断完成',
      data: undefined,
      source: 'GlobalGuideAnalyzer',
    });
  }
}

// 创建全局分析器实例
export const globalGuideAnalyzer = new GlobalGuideAnalyzer();

// 导出便捷方法
export const analyzeGlobalGuideIssue = () => {
  globalGuideAnalyzer.startAnalysis();

  // 5秒后自动停止分析
  setTimeout(() => {
    globalGuideAnalyzer.stopAnalysis();
  }, 5000);
};

export const quickDiagnoseGlobalGuide = () => {
  globalGuideAnalyzer.quickDiagnosis();
};

// 导出所有相关日志的便捷方法
export const exportAllGlobalGuideLogs = (filename?: string) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const finalFilename =
    filename || `global-guide-complete-analysis-${timestamp}.log`;

  logger.info({
    message: '开始导出全局引导相关日志',
    data: {
      filename: finalFilename,
      timestamp: new Date().toISOString(),
    },
    source: 'GlobalGuideAnalyzer',
    component: 'exportAllGlobalGuideLogs',
  });

  // 使用 log-exporter 导出日志
  exportLogsToFile(finalFilename);

  logger.info({
    message: '全局引导日志导出完成',
    data: {
      filename: finalFilename,
    },
    source: 'GlobalGuideAnalyzer',
  });
};

// 在控制台提供便捷方法
if (typeof window !== 'undefined') {
  (window as any).analyzeGlobalGuide = analyzeGlobalGuideIssue;
  (window as any).quickDiagnoseGuide = quickDiagnoseGlobalGuide;
  (window as any).exportAllGlobalGuideLogs = exportAllGlobalGuideLogs;
  (window as any).globalGuideAnalyzer = globalGuideAnalyzer;
}
